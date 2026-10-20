// Solo PostgreSQL local desechable. Nunca carga config/.env ni modifica Supabase.
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { Client } = require('pg');
const { EventEmitter2 } = require('@nestjs/event-emitter');
require('reflect-metadata');
require('ts-node').register({
  transpileOnly: true,
  skipProject: true,
  compilerOptions: {
    module: 'CommonJS',
    moduleResolution: 'Node',
    target: 'ES2023',
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
    esModuleInterop: true,
  },
});
const source = (path) =>
  require(resolve(__dirname, '../../../src/modules', path));
const { PrismaCronogramaRepository } = source(
  'cronograma/infrastructure/persistence/prisma-cronograma.repository.ts',
);
const { PrismaActivacionCronogramaRepository } = source(
  'cronograma/infrastructure/persistence/prisma-activacion-cronograma.repository.ts',
);
const { PrismaCronogramaUsuarioRepository } = source(
  'cronograma/infrastructure/persistence/prisma-cronograma-usuario.repository.ts',
);
const { PrismaCondicionesInicializacionUsuarioRepository } = source(
  'cronograma/infrastructure/persistence/prisma-condiciones-inicializacion-usuario.repository.ts',
);
const { ValidarConsistenciaCronogramaService } = source(
  'cronograma/application/service/validad-consistencia-global-cronograma.service.ts',
);
const { InicializarCronogramaUsuarioUseCase } = source(
  'cronograma/application/use-cases/cronograma/inicializar-cronograma-usuario.use-case.ts',
);
const { ConsultarMiCronogramaUseCase } = source(
  'cronograma/application/use-cases/cronograma/consultar-mi-cronograma.use-case.ts',
);
const { InicializarCronogramaRegistroListener } = source(
  'cronograma/infrastructure/messaging/inicializar-cronograma-registro.listener.ts',
);
const { PrismaUsuarioRepository } = source(
  'usuarios/infrastructure/persistence/prisma-usuario.repository.ts',
);
const { CreacionUsuarioUseCase } = source(
  'usuarios/application/use-cases/creacion-usuario.use-case.ts',
);
const { NestRegistroEstudiantePublisher } = source(
  'usuarios/infrastructure/messaging/nest-registro-estudiante.publisher.ts',
);
const { ESTUDIANTE_REGISTRADO } = source(
  'usuarios/application/ports/registro-estudiante.publisher.ts',
);
const { Sesion } = source('usuarios/domain/entities/sesiones.entity.ts');
const { Cronograma } = source(
  'cronograma/domain/entities/cronograma.entity.ts',
);
const { CronogramaUsuario } = source(
  'cronograma/domain/entities/cronograma-usuario.entity.ts',
);
const url = process.env.CRONOGRAMA_TEST_DATABASE_URL;
assert.ok(
  url,
  'Define CRONOGRAMA_TEST_DATABASE_URL para una base local vacía.',
);
const target = new URL(url);
assert.ok(
  ['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname),
  'Solo conexiones locales.',
);
assert.match(target.pathname, /^\/brisa_cronograma_test_[a-z0-9_]+$/);
const sql = new Client({ connectionString: url });
process.env.DATABASE_URL = url;
const { PrismaService } = require(
  resolve(__dirname, '../../../prisma/prisma.service.ts'),
);
const prisma = new PrismaService();
let checks = 0;
const pass = (message) => {
  checks++;
  console.log('PASS ' + message);
};
const migration = (name) =>
  readFileSync(
    resolve(__dirname, '../../../prisma/migrations', name, 'migration.sql'),
    'utf8',
  );
async function main() {
  await sql.connect();
  const zone =
    await prisma.$queryRaw`SELECT current_setting('TimeZone') AS zone`;
  assert.equal(zone[0].zone, 'UTC');
  pass('Prisma fija UTC incluso cuando PostgreSQL tiene zona Colombia');
  const tables = await sql.query(
    "SELECT count(*)::int AS total FROM information_schema.tables WHERE table_schema IN ('usuario','cronograma')",
  );
  assert.equal(
    tables.rows[0].total,
    0,
    'La prueba requiere una base vacía; no borra datos existentes.',
  );
  await sql.query(migration('0_init'));
  await sql.query(
    migration('20260901160216_eliminar_id_cronograma_redundante'),
  );
  // El baseline conserva la grafía anterior; la fixture reproduce el nombre vigente de Prisma.
  await sql.query(
    'ALTER TABLE usuario.usuarios RENAME COLUMN consentimiendo_aceptado TO consentimiento_aceptado',
  );
  const guarantees = migration('20260903233000_garantias_rf15_rf17_rf152');
  await sql.query(
    guarantees.slice(
      guarantees.indexOf(
        'CREATE OR REPLACE FUNCTION cronograma.fn_cronograma_usuario_validar_activo()',
      ),
      guarantees.indexOf('-- RF-152:'),
    ),
  );
  await sql.query(
    migration('20260907170000_calcular_ubicacion_temporal_usuario_rf22'),
  );
  await sql.query(
    migration('20260907200000_consultar_contenido_vigente_usuario_rf21'),
  );
  const consentimiento = await prisma.consentimientos.create({
    data: {
      titulo: 'Fixture local',
      version_consentimiento: 'test',
      url_contenido: 'Documento de prueba sin datos reales.',
      vigente: true,
    },
  });
  const cronogramas = new PrismaCronogramaRepository(prisma);
  const activacion = new PrismaActivacionCronogramaRepository(prisma);
  const asignaciones = new PrismaCronogramaUsuarioRepository(prisma);
  const condiciones = new PrismaCondicionesInicializacionUsuarioRepository(
    prisma,
  );
  const inicializar = new InicializarCronogramaUsuarioUseCase(
    condiciones,
    cronogramas,
    asignaciones,
  );
  const consultar = new ConsultarMiCronogramaUseCase(asignaciones, cronogramas);
  const validador = new ValidarConsistenciaCronogramaService();
  const validar = (estructura) => validador.validar(estructura);
  const eventos = new EventEmitter2();
  const listener = new InicializarCronogramaRegistroListener(inicializar);
  eventos.on(ESTUDIANTE_REGISTRADO, (evento) => listener.ejecutar(evento));
  const registrar = new CreacionUsuarioUseCase(
    new PrismaUsuarioRepository(prisma),
    { hash: async () => randomBytes(32).toString('hex') },
    {
      obtenerIdConsitimientoVigente: async () =>
        consentimiento.id_consentimiento,
    },
    {
      crearSesion: async (id) => ({
        sesion: Sesion.iniciar(
          id,
          randomBytes(32).toString('hex'),
          randomBytes(32).toString('hex'),
          'COMPLETA',
          15,
        ),
        tokenSesion: randomBytes(32).toString('hex'),
        csrfToken: randomBytes(32).toString('hex'),
      }),
    },
    new NestRegistroEstudiantePublisher(eventos),
  );
  const createBase = async (name, complete = true, esBase = true) => {
    const base = Cronograma.crearCronograma(name, esBase, new Date());
    await cronogramas.save(base);
    if (complete) {
      const unidad = await prisma.unidades_temporales.create({
        data: {
          id_cronograma: base.id_cronograma,
          nombre_unidad: 'Semana 1',
          orden_unidad: 1,
          fecha_inicio: new Date('2026-01-01'),
          fecha_fin: new Date('2026-01-08'),
        },
      });
      const contenido = await prisma.contenidos.create({
        data: { nombre_contenido: name, tipo_contenido: 'INFORMATIVO' },
      });
      const modulo = await prisma.modulos_sistema.upsert({
        where: { codigo_modulo: 'CHAT' },
        create: {
          codigo_modulo: 'CHAT',
          nombre_modulo: 'Chat de prueba',
          activo: true,
        },
        update: { activo: true },
      });
      await prisma.recursos_contenido.create({
        data: {
          id_contenido: contenido.id_contenido,
          tipo_recurso: 'TEXTO',
          orden_bloque: 1,
          texto_contenido: 'Recurso de prueba local',
          recursos_modulos_destino: { create: { id_modulo: modulo.id_modulo } },
        },
      });
      await prisma.contenidos_cronograma.create({
        data: {
          id_unidad_temporal: unidad.id_unidad_temporal,
          id_contenido: contenido.id_contenido,
          orden_contenido: 1,
          fecha_inicio_disponibilidad: new Date('2026-01-01'),
          fecha_fin_disponibilidad: new Date('2026-01-08'),
        },
      });
    }
    return base;
  };
  const createStudent = async () => {
    const correo = randomBytes(12).toString('hex') + '@example.invalid';
    await registrar.execute({
      correoElectronico: correo,
      contrasena: randomBytes(24).toString('hex'),
      ciudad: 'Ciudad de prueba',
      entidad_educativa: 'Universidad de prueba',
      programa_academico: 'Programa de prueba',
      semestre: 1,
      nivelAcademico: 'PREGRADO',
      fechaNacimiento: new Date('2000-01-01'),
      fechaInicioConsumo: new Date('2025-01-01'),
      fechaUltimoConsumo: new Date('2026-01-01'),
      motivoInicioConsumo: 'CURIOSIDAD',
      frecuenciaConsumo: 1,
    });
    return prisma.usuarios.findUniqueOrThrow({
      where: { correo_electronico: correo },
    });
  };
  const primero = await createBase('Primer base');
  await activacion.activar(primero.id_cronograma, validar);
  const estudiante = await createStudent();
  const original = await asignaciones.buscarPorUsuario(estudiante.id_usuario);
  assert.equal(original.id_cronograma, primero.id_cronograma);
  pass(
    'registro real persiste cuenta, línea base, sesión y asignación inmediata al base activo',
  );
  const vigente = await sql.query(
    'SELECT * FROM cronograma.fn_contenido_vigente_usuario($1, $2)',
    [estudiante.id_usuario, new Date()],
  );
  assert.equal(vigente.rows[0].nombre_contenido, 'Primer base');
  pass('contenido visible según fecha de inicio individual mediante RF-21');
  const segundo = await createBase('Segundo base');
  assert.equal(
    (await cronogramas.buscarBaseActiva()).id_cronograma,
    primero.id_cronograma,
  );
  pass('preparar otro base inactivo no interrumpe los registros nuevos');
  const invalido = await createBase('Incompleto', false);
  await assert.rejects(
    activacion.activar(invalido.id_cronograma, validar),
    (error) => error.getStatus() === 422,
  );
  assert.equal(
    (await cronogramas.buscarBaseActiva()).id_cronograma,
    primero.id_cronograma,
  );
  pass('rechazar planificación incompleta conserva el base anterior');
  // Un fallo después de quitar la marca debe revertir también esa escritura.
  const failing = new PrismaActivacionCronogramaRepository({
    $transaction: (callback, options) =>
      prisma.$transaction(
        (tx) =>
          callback({
            cronogramas: {
              findUnique: tx.cronogramas.findUnique.bind(tx.cronogramas),
              updateMany: tx.cronogramas.updateMany.bind(tx.cronogramas),
              update: async () => {
                throw new Error('Fallo inducido local');
              },
            },
          }),
        options,
      ),
  });
  await assert.rejects(failing.activar(segundo.id_cronograma, validar));
  assert.equal(
    (await cronogramas.buscarBaseActiva()).id_cronograma,
    primero.id_cronograma,
  );
  pass(
    'rollback real restaura la marca anterior si falla la escritura de activación',
  );
  await activacion.activar(segundo.id_cronograma, validar);
  const anterior = await cronogramas.buscarPorId(primero.id_cronograma);
  assert.equal(anterior.es_base, false);
  assert.equal(anterior.estado, 'ACTIVO');
  const despues = await asignaciones.buscarPorUsuario(estudiante.id_usuario);
  assert.equal(despues.id_cronograma_usuario, original.id_cronograma_usuario);
  assert.deepEqual(despues.fecha_inicio_usuario, original.fecha_inicio_usuario);
  assert.equal(
    (await consultar.execute(estudiante.id_usuario)).nombre,
    'Primer base',
  );
  pass(
    'reemplazo cambia es_base y conserva asignación, inicio, estado y consulta de alumnos anteriores',
  );
  const nuevo = await createStudent();
  assert.equal(
    (await asignaciones.buscarPorUsuario(nuevo.id_usuario)).id_cronograma,
    segundo.id_cronograma,
  );
  pass('los registros posteriores reciben el nuevo base');
  await assert.rejects(
    inicializar.execute(nuevo.id_usuario),
    (error) => error.getStatus() === 409,
  );
  assert.equal(
    await prisma.cronogramas_usuario.count({
      where: { id_usuario: nuevo.id_usuario },
    }),
    1,
  );
  pass('asignación única incluso si se reintenta');
  await assert.rejects(
    activacion.activar(segundo.id_cronograma, validar),
    (error) => error.getStatus() === 409,
  );
  pass('no permite reactivar un cronograma ya activo');
  const candidatos = await Promise.all([
    createBase('Concurrente A'),
    createBase('Concurrente B'),
  ]);
  const results = await Promise.allSettled(
    candidatos.map((base) => activacion.activar(base.id_cronograma, validar)),
  );
  assert.ok(results.some((result) => result.status === 'fulfilled'));
  assert.equal(
    await prisma.cronogramas.count({
      where: { es_base: true, estado: 'ACTIVO' },
    }),
    1,
  );
  pass(
    'publicaciones concurrentes conservan exactamente un cronograma base activo',
  );
  const estandar = await createBase('Estándar', true, false);
  const baseAntes = await cronogramas.buscarBaseActiva();
  await activacion.activar(estandar.id_cronograma, validar);
  assert.equal(
    (await cronogramas.buscarBaseActiva()).id_cronograma,
    baseAntes.id_cronograma,
  );
  pass('activar un cronograma estándar no cambia el base');
  const pendiente = await createStudent();
  await prisma.cronogramas_usuario.delete({
    where: { id_usuario: pendiente.id_usuario },
  });
  await assert.rejects(
    asignaciones.crear(
      CronogramaUsuario.inicializar(
        pendiente.id_usuario,
        invalido.id_cronograma,
      ),
    ),
  );
  pass('la BD rechaza asignación directa a cronograma inactivo');
  const baseActual = await cronogramas.buscarBaseActiva();
  await prisma.cronogramas.updateMany({
    where: { es_base: true },
    data: { es_base: false },
  });
  const sinBase = await createStudent();
  assert.equal(await asignaciones.buscarPorUsuario(sinBase.id_usuario), null);
  pass(
    'sin base activo el registro se conserva pendiente, sin error 500 ni asignación inválida',
  );
  await prisma.cronogramas.update({
    where: { id_cronograma: baseActual.id_cronograma },
    data: { es_base: true },
  });
  const { InicializarCronogramasPendientesCron } = source(
    'cronograma/infrastructure/cron/inicializar-cronogramas-pendientes.cron.ts',
  );
  await new InicializarCronogramasPendientesCron(
    condiciones,
    inicializar,
  ).ejecutar();
  assert.equal(
    (await asignaciones.buscarPorUsuario(sinBase.id_usuario)).id_cronograma,
    baseActual.id_cronograma,
  );
  pass(
    'el cron existente recupera los pendientes cuando vuelve a haber base activo',
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
