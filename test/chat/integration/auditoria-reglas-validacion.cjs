// Prueba explícita sobre PostgreSQL local desechable. No usa config/.env.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { randomBytes, randomUUID } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { isAbsolute, resolve } = require('node:path');
const { Client } = require('pg');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

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
const {
  PrismaArbolConversacionalRepository,
} = require('../../../src/modules/chat/infrastructure/persistence/prisma-arbol-conversacional.repository.ts');

const root = resolve(__dirname, '../../..');
const name = 'brisa-hu03-audit-' + randomUUID().slice(0, 8);
const databasePassword = randomBytes(32).toString('hex');
// Para instalaciones distintas, HU03_DOCKER_EXECUTABLE exige una ruta absoluta.
// Nunca se busca el ejecutable en PATH.
const dockerExecutable =
  process.env.HU03_DOCKER_EXECUTABLE ??
  (process.platform === 'win32'
    ? 'C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe'
    : process.platform === 'darwin'
      ? '/usr/local/bin/docker'
      : '/usr/bin/docker');
assert.ok(
  isAbsolute(dockerExecutable),
  'HU03_DOCKER_EXECUTABLE debe identificar un ejecutable por ruta absoluta.',
);
const docker = (...args) =>
  execFileSync(dockerExecutable, args, {
    encoding: 'utf8',
    timeout: 180_000,
    env: { ...process.env, POSTGRES_PASSWORD: databasePassword },
  }).trim();
const localEndpoint = (host) =>
  /^(npipe:|unix:|tcp:\/\/(127\.0\.0\.1|localhost):)/.test(host);
let creationRequested = false;
let client;
let prisma;
let checks = 0;
const passed = (label) => {
  checks += 1;
  console.log('PASS ' + label);
};
const migration = (folder) =>
  readFileSync(
    resolve(root, 'prisma/migrations', folder, 'migration.sql'),
    'utf8',
  );

async function main() {
  if (process.env.DOCKER_HOST)
    assert.ok(localEndpoint(process.env.DOCKER_HOST), 'Docker debe ser local.');
  assert.ok(
    localEndpoint(
      docker('context', 'inspect', '--format', '{{.Endpoints.docker.Host}}'),
    ),
    'El contexto Docker debe ser local.',
  );
  console.log(
    'Creando PostgreSQL 17 local desechable (' +
      name +
      '), sin volúmenes del host.',
  );
  creationRequested = true;
  docker(
    'run',
    '--detach',
    '--rm',
    '--name',
    name,
    '--label',
    'brisa.test=hu03-audit',
    '--publish',
    '127.0.0.1::5432',
    '--env',
    'POSTGRES_DB=hu03_test',
    '--env',
    'POSTGRES_PASSWORD',
    'postgres:17-alpine',
  );
  const port = docker(
    'inspect',
    '--format',
    '{{(index (index .NetworkSettings.Ports "5432/tcp") 0).HostPort}}',
    name,
  );
  assert.match(port, /^\d+$/);
  const connectionString =
    'postgresql://postgres:' +
    databasePassword +
    '@127.0.0.1:' +
    port +
    '/hu03_test';
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const candidate = new Client({
      connectionString,
      connectionTimeoutMillis: 1000,
    });
    try {
      await candidate.connect();
      client = candidate;
      break;
    } catch {
      await candidate.end().catch(() => {});
      await new Promise((done) => setTimeout(done, 500));
    }
  }
  assert.ok(client, 'PostgreSQL local no estuvo listo.');
  await client.query(
    'CREATE SCHEMA chat; CREATE SCHEMA usuario;' +
      "CREATE TYPE chat.modalidad_enum AS ENUM ('GRUPAL','PERSONALIZADA');" +
      "CREATE TYPE chat.tipo_dato_validacion_enum AS ENUM ('TEXTO','NUMERICO','FECHA','SELECCION');" +
      'CREATE TABLE usuario.usuarios (id_usuario uuid PRIMARY KEY);' +
      'CREATE TABLE chat.flujo_conversacion (id_flujo uuid PRIMARY KEY, tipo_dependencia text, tipo_craving text, modalidad chat.modalidad_enum NOT NULL, version int NOT NULL);' +
      'CREATE TABLE chat.reglas_validaciones (id_regla_validacion uuid PRIMARY KEY DEFAULT gen_random_uuid(), tipo_dato chat.tipo_dato_validacion_enum NOT NULL, obligatorio boolean NOT NULL DEFAULT true, valor_min numeric, valor_max numeric, formato_regex text, valores_permitidos text[], mensaje_error text NOT NULL);',
  );
  await client.query(migration('20260930120000_arboles_personalizados_rf25c'));
  const actor = randomUUID();
  const flujo = randomUUID();
  const objeto = randomUUID();
  await client.query('INSERT INTO usuario.usuarios VALUES ($1)', [actor]);
  await client.query(
    "INSERT INTO chat.flujo_conversacion VALUES ($1,NULL,NULL,'GRUPAL',1)",
    [flujo],
  );
  await client.query(
    "INSERT INTO chat.auditoria_arboles (id_flujo,id_actor,accion) VALUES ($1,$2,'CREAR_FLUJO')",
    [flujo, actor],
  );
  await client.query(
    migration('20261017190000_auditoria_reglas_validacion_hu03'),
  );
  assert.equal(
    (
      await client.query(
        'SELECT count(*)::int AS total FROM chat.auditoria_arboles',
      )
    ).rows[0].total,
    1,
  );
  passed('la migración conserva una auditoría anterior');
  const actions = [
    'CREAR_FLUJO',
    'CLONAR_VERSION',
    'CREAR_NODO',
    'EDITAR_NODO',
    'CREAR_TRANSICION',
    'EDITAR_TRANSICION',
    'PUBLICAR',
    'ARCHIVAR',
  ];
  for (const action of actions) {
    await client.query(
      'INSERT INTO chat.auditoria_arboles (id_flujo,id_actor,accion) VALUES ($1,$2,$3)',
      [flujo, actor, action],
    );
    passed('conserva ' + action + ' con flujo');
    await assert.rejects(
      client.query(
        'INSERT INTO chat.auditoria_arboles (id_actor,accion) VALUES ($1,$2)',
        [actor, action],
      ),
      { code: '23514' },
    );
    passed('rechaza ' + action + ' sin flujo');
  }
  await assert.rejects(
    client.query(
      "INSERT INTO chat.auditoria_arboles (id_flujo,id_actor,accion,id_objeto) VALUES ($1,$2,'CREAR_REGLA_VALIDACION',$3)",
      [flujo, actor, objeto],
    ),
    { code: '23514' },
  );
  passed('rechaza un flujo en el evento global');
  await assert.rejects(
    client.query(
      "INSERT INTO chat.auditoria_arboles (id_actor,accion) VALUES ($1,'CREAR_REGLA_VALIDACION')",
      [actor],
    ),
    { code: '23514' },
  );
  passed('rechaza evento global sin objeto');
  await assert.rejects(
    client.query(
      "INSERT INTO chat.auditoria_arboles (id_flujo,id_actor,accion) VALUES ($1,$2,'BORRAR_REGLA')",
      [flujo, actor],
    ),
    { code: '23514' },
  );
  passed('rechaza acciones no admitidas');
  await assert.rejects(
    client.query(
      "UPDATE chat.auditoria_arboles SET accion='CREAR_NODO' WHERE id_flujo=$1",
      [flujo],
    ),
    { code: 'P0001' },
  );
  await assert.rejects(
    client.query('DELETE FROM chat.auditoria_arboles WHERE id_flujo=$1', [
      flujo,
    ]),
    { code: 'P0001' },
  );
  passed('conserva la inmutabilidad frente a UPDATE y DELETE');
  prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  const repository = new PrismaArbolConversacionalRepository(prisma);
  const command = {
    tipoDato: 'NUMERICO',
    obligatorio: false,
    valorMin: 0,
    valorMax: 2.75,
    formatoRegex: null,
    valoresPermitidos: [],
    mensajeError: 'Fuera de rango',
    creadoPor: actor,
  };
  const regla = await repository.crearReglaValidacion(command);
  const audit = await client.query(
    "SELECT id_flujo,id_actor,id_objeto FROM chat.auditoria_arboles WHERE accion='CREAR_REGLA_VALIDACION'",
  );
  assert.deepEqual(audit.rows, [
    { id_flujo: null, id_actor: actor, id_objeto: regla.idReglaValidacion },
  ]);
  assert.equal(regla.valorMin, 0);
  assert.equal(regla.valorMax, 2.75);
  assert.equal(regla.obligatorio, false);
  passed('el repositorio real crea regla y auditoría con el mismo UUID');
  const countRules = async () =>
    (
      await client.query(
        'SELECT count(*)::int AS total FROM chat.reglas_validaciones',
      )
    ).rows[0].total;
  const before = await countRules();
  await assert.rejects(
    repository.crearReglaValidacion({ ...command, creadoPor: randomUUID() }),
    { code: 'P2003' },
  );
  assert.equal(await countRules(), before);
  assert.equal(
    (
      await client.query(
        "SELECT count(*)::int AS total FROM chat.auditoria_arboles WHERE accion='CREAR_REGLA_VALIDACION'",
      )
    ).rows[0].total,
    1,
  );
  passed(
    'rollback físico de la regla cuando falla la FK del actor de auditoría',
  );
  console.log(
    JSON.stringify({
      checks,
      failed: 0,
      database: 'PostgreSQL 17 local desechable',
    }),
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const closing = await Promise.allSettled([
      prisma?.$disconnect(),
      client?.end(),
    ]);
    for (const result of closing) {
      if (result.status === 'rejected') {
        console.error(
          'Falló el cierre de la conexión de prueba:',
          result.reason,
        );
        process.exitCode = 1;
      }
    }
    if (creationRequested) {
      try {
        execFileSync(dockerExecutable, ['rm', '--force', name], {
          encoding: 'utf8',
          timeout: 10_000,
        });
      } catch {
        console.error(
          'No se pudo confirmar la limpieza del contenedor ' + name,
        );
        process.exitCode = 1;
      }
    }
  });
