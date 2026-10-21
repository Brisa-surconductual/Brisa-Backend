// Solo PostgreSQL local desechable; no carga config/.env ni modifica Supabase.
const assert = require('node:assert/strict');
const { randomBytes, randomUUID } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { Client } = require('pg');
const url = process.env.DASHBOARD_TEST_DATABASE_URL;
assert.ok(url, 'Define DASHBOARD_TEST_DATABASE_URL para una base local vacía.');
const target = new URL(url);
assert.ok(
  ['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname),
  'Solo conexiones locales.',
);
assert.match(target.pathname, /^\/brisa_dashboard_test_[a-z0-9_]+$/);
process.env.DATABASE_URL = url;
const { PrismaService } = require('../../../dist/prisma/prisma.service.js');
const {
  PrismaEstadisticasProgramaRepository,
} = require('../../../dist/src/modules/usuarios/infrastructure/persistence/prisma-estadisticas-programa.repository.js');
const prisma = new PrismaService();
const sql = new Client({ connectionString: url });
const repository = new PrismaEstadisticasProgramaRepository(prisma);
let checks = 0;
function pass(message) {
  checks++;
  console.log('PASS ' + message);
}
async function createSchedule(base, state) {
  const id = randomUUID();
  await sql.query(
    'INSERT INTO cronograma.cronogramas (id_cronograma, nombre_cronograma, es_base, estado) VALUES ($1, $2, $3, $4)',
    [id, 'Dashboard integración', base, state],
  );
  return id;
}
async function createUnit(schedule, order, start, end) {
  const id = randomUUID();
  await sql.query(
    'INSERT INTO cronograma.unidades_temporales (id_unidad_temporal, id_cronograma, nombre_unidad, orden_unidad, fecha_inicio, fecha_fin) VALUES ($1, $2, $3, $4, $5, $6)',
    [id, schedule, 'Unidad de prueba', order, start, end],
  );
  return id;
}
async function main() {
  await sql.connect();
  const tables = await sql.query(
    "SELECT COUNT(*)::int AS total FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema')",
  );
  assert.equal(tables.rows[0].total, 0, 'La base debe estar vacía.');
  await sql.query(
    readFileSync(
      resolve(__dirname, '../../../prisma/migrations/0_init/migration.sql'),
      'utf8',
    ),
  );
  assert.deepEqual(await repository.consultar(), {
    estudiantesActivos: 0,
    conRegistroCompleto: 0,
    conRegistroPendiente: 0,
    diasCronogramaBase: null,
  });
  pass('sin estudiantes ni base retorna ceros y duración nula');
  let pendingId;
  for (const [role, state, registration] of [
    ['ESTUDIANTE', 'ACTIVA', 'REGISTRO_COMPLETO'],
    ['ESTUDIANTE', 'ACTIVA', 'PENDIENTE_CONSENTIMIENTO'],
    ['ESTUDIANTE', 'ACTIVA', 'PENDIENTE_REVISION'],
    ['ESTUDIANTE', 'BLOQUEADA', 'REGISTRO_COMPLETO'],
    ['ESTUDIANTE', 'PENDIENTE_ACTIVACION', 'REGISTRO_COMPLETO'],
    ['ADMINISTRATIVO', 'ACTIVA', 'REGISTRO_COMPLETO'],
  ]) {
    const id = randomUUID();
    if (registration === 'PENDIENTE_CONSENTIMIENTO') pendingId = id;
    await sql.query(
      'INSERT INTO usuario.usuarios (id_usuario, correo_electronico, contrasena_hash, rol, estado_cuenta, estado_registro) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        id,
        `${id}@brisa.test`,
        randomBytes(32).toString('hex'),
        role,
        state,
        registration,
      ],
    );
  }
  const expected = {
    estudiantesActivos: 3,
    conRegistroCompleto: 1,
    conRegistroPendiente: 2,
    diasCronogramaBase: null,
  };
  assert.deepEqual(await repository.consultar(), expected);
  pass(
    'cuenta solo estudiantes con cuenta ACTIVA y distingue los dos estados pendientes',
  );
  const standard = await createSchedule(false, 'ACTIVO');
  await createUnit(standard, 1, '2026-01-01', '2026-02-19');
  const draft = await createSchedule(true, 'INACTIVO');
  await createUnit(draft, 1, '2026-01-01', '2026-01-08');
  assert.deepEqual(await repository.consultar(), expected);
  pass('ignora la duración de cronogramas estándar y de bases inactivos');
  const activeBase = await createSchedule(true, 'ACTIVO');
  assert.deepEqual(await repository.consultar(), expected);
  pass('un base histórico sin unidades no inventa duración');
  await createUnit(activeBase, 1, '2026-10-20', '2026-10-25');
  const lastUnit = await createUnit(activeBase, 2, '2026-10-27', '2026-10-30');
  assert.deepEqual(await repository.consultar(), {
    ...expected,
    diasCronogramaBase: 10,
  });
  pass(
    'duración del base activo usa el rango total, incluidos los intervalos entre unidades',
  );
  await sql.query(
    "UPDATE usuario.usuarios SET estado_registro='REGISTRO_COMPLETO' WHERE id_usuario=$1",
    [pendingId],
  );
  await sql.query(
    "UPDATE cronograma.unidades_temporales SET fecha_fin='2026-10-31' WHERE id_unidad_temporal=$1",
    [lastUnit],
  );
  assert.deepEqual(await repository.consultar(), {
    estudiantesActivos: 3,
    conRegistroCompleto: 2,
    conRegistroPendiente: 1,
    diasCronogramaBase: 11,
  });
  pass(
    'una nueva consulta refleja cambios persistidos sin mantener valores de ejemplo',
  );
  console.log(
    JSON.stringify({
      passed: checks,
      failed: 0,
      database: 'PostgreSQL local desechable',
    }),
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await sql.end();
  });
