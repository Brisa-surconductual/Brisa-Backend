const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { randomBytes, randomUUID } = require('node:crypto');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
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
  PrismaTransicionModalidadProgramaRepository,
} = require('../../../src/modules/chat/infrastructure/persistence/prisma-transicion-modalidad-programa.repository.ts');

const root = path.resolve(__dirname, '../../..');
const bin = 'C:/Program Files/PostgreSQL/18/bin';
const directory = fs.mkdtempSync(
  path.join(os.tmpdir(), 'brisa-rf25b-'),
);
const data = path.join(directory, 'data');
const password = randomBytes(24).toString('hex');
const passwordFile = path.join(directory, 'password');

let prisma;
let client;
let started = false;

const cli = (name, args) =>
  execFileSync(path.join(bin, name + '.exe'), args, {
    stdio: 'ignore',
    timeout: name === 'initdb' ? 300000 : 120000,
    windowsHide: true,
  });

async function ejecutar() {
  console.log('RF-25B: iniciando PostgreSQL local aislado');

  fs.writeFileSync(passwordFile, password);

  const servidor = net.createServer();

  await new Promise((resolve, reject) => {
    servidor.once('error', reject);
    servidor.listen(0, '127.0.0.1', resolve);
  });

  const port = servidor.address().port;
  await new Promise((resolve) => servidor.close(resolve));

  cli('initdb', [
    '-D', data,
    '-U', 'postgres',
    '--auth=scram-sha-256',
    '--pwfile=' + passwordFile,
    '--encoding=UTF8',
    '--locale=C',
    '--no-sync',
  ]);

  cli('pg_ctl', [
    'start',
    '-D', data,
    '-l', path.join(directory, 'server.log'),
    '-o', '-h 127.0.0.1 -p ' + port,
    '-w',
    '-t', '45',
  ]);

  started = true;
  fs.unlinkSync(passwordFile);

  const connectionString =
    'postgresql://postgres:' + password +
    '@127.0.0.1:' + port + '/postgres';

  client = new Client({ connectionString });
  await client.connect();

  const schema = fs.readFileSync(
    path.join(root, 'test/chat/fixtures/schema-rf25b.sql'),
    'utf8',
  );

  await client.query(schema);

  prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  const repo = new PrismaTransicionModalidadProgramaRepository(prisma);

  const administrador = randomUUID();
  const usuario1 = randomUUID();
  const usuario2 = randomUUID();

  for (const [id, rol] of [
    [administrador, 'ADMINISTRATIVO'],
    [usuario1, 'ESTUDIANTE'],
    [usuario2, 'ESTUDIANTE'],
  ]) {
    await client.query(
      `INSERT INTO usuario.usuarios
       (id_usuario, rol, estado_cuenta)
       VALUES ($1, $2::usuario.rol_enum, 'ACTIVA')`,
      [id, rol],
    );
  }

  await client.query(
    `INSERT INTO chat.perfil_clinico
     (id_usuario, tipo_dependencia, tipo_craving)
     VALUES ($1, 'TOLERANCIA', 'NEGATIVO'),
            ($2, 'TOLERANCIA', NULL)`,
    [usuario1, usuario2],
  );

  for (const id of [usuario1, usuario2]) {
    await client.query(
      `INSERT INTO chat.tipo_terapia
       (id_usuario, id_programa, modalidad)
       VALUES ($1, 12, 'GRUPAL')`,
      [id],
    );
  }


  const usuarioBloqueado = randomUUID();
  await client.query(
    "INSERT INTO usuario.usuarios (id_usuario, rol, estado_cuenta) VALUES ($1, $2::usuario.rol_enum, $3::usuario.estado_cuenta_enum)",
    [usuarioBloqueado, "ESTUDIANTE", "BLOQUEADA"],
  );
  await client.query(
    "INSERT INTO chat.tipo_terapia (id_usuario, id_programa, modalidad) VALUES ($1, 12, $2::chat.modalidad_enum)",
    [usuarioBloqueado, "GRUPAL"],
  );
  const consultaBloqueado = "SELECT id_tipo_terapia, modalidad::text AS modalidad, fecha_vigencia_desde, fecha_vigencia_hasta, administrador_responsable FROM chat.tipo_terapia WHERE id_usuario = $1";
  const vigenciaBloqueadaInicial = (
    await client.query(consultaBloqueado, [usuarioBloqueado])
  ).rows;


  const idFlujoSesion = randomUUID();
  const idNodoSesion = randomUUID();
  const idSesionExistente = randomUUID();

  await client.query(
    "INSERT INTO chat.flujo_conversacion (id_flujo) VALUES ($1)",
    [idFlujoSesion],
  );
  await client.query(
    "INSERT INTO chat.nodos (id_nodo, id_flujo) VALUES ($1, $2)",
    [idNodoSesion, idFlujoSesion],
  );
  await client.query(
    "INSERT INTO chat.sesiones (id_sesion, id_usuario, id_flujo_conversacional, version_arbol_utilizada, modalidad_activa, id_nodo_actual) VALUES ($1, $2, $3, $4, $5::chat.modalidad_enum, $6)",
    [idSesionExistente, usuario1, idFlujoSesion, 1, "GRUPAL", idNodoSesion],
  );
  await client.query(
    "INSERT INTO chat.historial_nodos (id_sesion, id_nodo, id_usuario, respuesta_usuario) VALUES ($1, $2, $3, $4::jsonb)",
    [idSesionExistente, idNodoSesion, usuario1, JSON.stringify({ texto: "Respuesta anterior" })],
  );

  const snapshotConversacion = async () => ({
    sesiones: (
      await client.query(
        "SELECT * FROM chat.sesiones WHERE id_sesion = $1",
        [idSesionExistente],
      )
    ).rows,
    historial: (
      await client.query(
        "SELECT * FROM chat.historial_nodos WHERE id_sesion = $1 ORDER BY id_historial",
        [idSesionExistente],
      )
    ).rows,
  });

  const conversacionAntes = await snapshotConversacion();

  const solicitud = {
    idPrograma: 12,
    idAdministrador: administrador,
  };

  async function historial() {
    const resultado = await client.query(
      `SELECT id_usuario, modalidad::text AS modalidad,
              fecha_vigencia_desde, fecha_vigencia_hasta,
              administrador_responsable
       FROM chat.tipo_terapia
       ORDER BY id_usuario, fecha_vigencia_desde`,
    );

    return resultado.rows;
  }

  // 1. Perfil incompleto: prohibir la transición.
  const anterior = await historial();

  await assert.rejects(
    repo.habilitarPersonalizada(solicitud),
    (error) => error.getStatus?.() === 409 &&
      error.getResponse?.().codigo === 'PERFILES_INCOMPLETOS',
  );

  assert.deepEqual(await historial(), anterior);
  console.log('PASS: perfiles incompletos, sin escrituras');

  // 2. Completar el perfil.
  await client.query(
    `UPDATE chat.perfil_clinico
     SET tipo_craving = 'NEGATIVO'
     WHERE id_usuario = $1`,
    [usuario2],
  );

  // 3. Forzar fallo de FK al crear nuevas vigencias.
  // PostgreSQL debe revertir también el cierre anterior.
  await assert.rejects(
    repo.habilitarPersonalizada({
      idPrograma: 12,
      idAdministrador: randomUUID(),
    }),
  );

  assert.deepEqual(await historial(), anterior);
  console.log('PASS: rollback real ante fallo de escritura');

  // 4. Intentar la misma transicion simultaneamente.
  const intentos = await Promise.allSettled([
    repo.habilitarPersonalizada(solicitud),
    repo.habilitarPersonalizada(solicitud),
  ]);

  const exitosos = intentos.filter((x) => x.status === "fulfilled");
  const fallidos = intentos.filter((x) => x.status === "rejected");

  assert.equal(exitosos.length, 1);
  assert.equal(fallidos.length, 1);
  assert.equal(fallidos[0].reason?.getStatus?.(), 409);

  const resultado = exitosos[0].value;
  console.log("PASS: una sola transicion ante solicitudes concurrentes");

  assert.equal(resultado.modalidad, 'PERSONALIZADA');
  assert.equal(resultado.usuariosActualizados, 2);
  assert.equal(resultado.administradorResponsable, administrador);

  const registros = await historial();

  assert.equal(registros.length, 5);
  assert.equal(
    registros.filter((fila) =>
      fila.modalidad === 'GRUPAL' &&
      fila.fecha_vigencia_hasta !== null
    ).length,
    2,
  );

  assert.equal(
    registros.filter((fila) =>
      fila.modalidad === 'PERSONALIZADA' &&
      fila.fecha_vigencia_hasta === null &&
      fila.administrador_responsable === administrador
    ).length,
    2,
  );

  console.log('PASS: transición atómica e historial conservado');


  const vigenciaBloqueadaFinal = (
    await client.query(consultaBloqueado, [usuarioBloqueado])
  ).rows;
  assert.deepEqual(vigenciaBloqueadaFinal, vigenciaBloqueadaInicial);
  assert.equal(vigenciaBloqueadaFinal[0].modalidad, "GRUPAL");
  console.log("PASS: participante bloqueado conserva su vigencia");


  assert.equal(conversacionAntes.sesiones.length, 1);
  assert.equal(conversacionAntes.historial.length, 1);
  assert.deepEqual(await snapshotConversacion(), conversacionAntes);
  assert.equal(conversacionAntes.sesiones[0].modalidad_activa, "GRUPAL");
  console.log("PASS: sesion e historial preexistentes conservados");

  // 5. Impedir una segunda transición sobre el mismo programa.
  await assert.rejects(
    repo.habilitarPersonalizada(solicitud),
    (error) => error.getStatus?.() === 409,
  );

  assert.equal((await historial()).length, 5);
  console.log('PASS: transición repetida rechazada');

  console.log('RF-25B: 7 verificaciones completadas');
}

ejecutar()
  .catch((error) => {
    console.error('FAIL RF-25B:', error.code || error.name);
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.allSettled([
      prisma?.$disconnect(),
      client?.end(),
    ]);

    try {
      if (started) {
        cli('pg_ctl', [
          'stop', '-D', data, '-m', 'fast', '-w', '-t', '45',
        ]);
      }

      const temporal = fs.realpathSync(os.tmpdir());
      const actual = fs.realpathSync(directory);

      assert.equal(path.dirname(actual), temporal);
      assert.ok(path.basename(actual).startsWith('brisa-rf25b-'));

      fs.rmSync(directory, {
        recursive: true,
        maxRetries: 5,
        retryDelay: 200,
      });

      console.log('PostgreSQL temporal eliminado.');
    } catch (error) {
      console.error('Error de limpieza:', error.message);
      console.error('Directorio:', directory);
      process.exitCode = 1;
    }
  });
