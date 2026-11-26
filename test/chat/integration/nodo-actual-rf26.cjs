// PostgreSQL local vacío y desechable. No carga config/.env ni acepta Supabase.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { Client } = require('pg');
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
const source = (name) =>
  require(resolve(__dirname, '../../../src/modules/chat', name));
const { ConsultarNodoActualUseCase } = source(
  'application/use-cases/sesion/consultar-nodo-actual.use-case.ts',
);
const { PrismaSesionConversacionalRepository } = source(
  'infrastructure/persistence/prisma-sesion-conversacional.repository.ts',
);
const { PrismaArbolConversacionalRepository } = source(
  'infrastructure/persistence/prisma-arbol-conversacional.repository.ts',
);
const { PrismaService } = require('../../../prisma/prisma.service.ts');
const { PrismaPresentacionNodoActualRepository } = source(
  'infrastructure/persistence/prisma-presentacion-nodo-actual.repository.ts',
);
const { PresentarNodoActualService } = source(
  'application/services/presentar-nodo-actual.service.ts',
);
const { PresentarBloquesNodoActualService } = source(
  'application/services/presentar-bloques-nodo-actual.service.ts',
);
const { PrepararEntradaNodoActualService } = source(
  'application/services/preparar-entrada-nodo-actual.service.ts',
);
const { S3FirmarRecursoNodoAdapter } = source(
  'infrastructure/storage/s3-firmar-recurso-nodo.adapter.ts',
);
const { S3Client } = require('@aws-sdk/client-s3');
const connection = process.env.RF26_TEST_DATABASE_URL;
assert.ok(
  connection,
  'Define RF26_TEST_DATABASE_URL para una base local vacía.',
);
const url = new URL(connection);
assert.ok(
  ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname),
  'Solo PostgreSQL local.',
);
assert.match(url.pathname, /^\/brisa_rf26_test_[a-z0-9_]+$/);
process.env.DATABASE_URL = connection;
const prisma = new PrismaService();
const sql = new Client({ connectionString: connection });
process.env.AWS_S3_BUCKET = 'brisa-rf26-pruebas';
const s3 = new S3Client({
  region: 'us-east-1',
  credentials: { accessKeyId: randomUUID(), secretAccessKey: randomUUID() },
});
const ids = Object.fromEntries(
  [
    'usuario',
    'otroUsuario',
    'actor',
    'flujoOriginal',
    'flujoNuevo',
    'tipo',
    'primero',
    'actual',
    'siguiente',
    'nuevoPublicado',
    'sesion',
    'sesionAjena',
    'sesionError',
    'sesionInconsistente',
  ].map((key) => [key, randomUUID()]),
);
const contenido = {
  texto: '  Nodo actual\nTexto intacto. ',
  instrucciones: 'Conserva el orden.',
  multimedia: [
    { url: 'https://example.test/segundo.png' },
    { url: 'https://example.test/primero.png' },
  ],
  extension: { valor: false },
};
let checks = 0;
const pass = (message) => {
  checks++;
  console.log('PASS ' + message);
};

async function snapshot() {
  const rows = await sql.query(`SELECT jsonb_build_object(
    'sesiones', (SELECT jsonb_agg(to_jsonb(s) ORDER BY id_sesion) FROM chat.sesiones s),
    'estados', (SELECT jsonb_agg(to_jsonb(e) ORDER BY id_sesion) FROM chat.estado_sesiones e),
    'nodos', (SELECT jsonb_agg(to_jsonb(n) ORDER BY id_nodo) FROM chat.nodos n),
    'transiciones', (SELECT jsonb_agg(to_jsonb(t) ORDER BY id_regla) FROM chat.reglas_nodos t)
  ) AS datos`);
  return rows.rows[0].datos;
}

async function leer(idSesion, idUsuario = ids.usuario) {
  const antes = await snapshot();
  try {
    return await prisma.$transaction(
      async (tx) => {
        // Cualquier escritura accidental hace fallar la consulta, aun si no se observa en el snapshot.
        await tx.$executeRaw`SET TRANSACTION READ ONLY`;
        const caso = new ConsultarNodoActualUseCase(
          new PrismaSesionConversacionalRepository(tx),
          new PrismaArbolConversacionalRepository(tx),
          new PresentarNodoActualService(
            new PrismaPresentacionNodoActualRepository(tx),
            new PresentarBloquesNodoActualService(
              new S3FirmarRecursoNodoAdapter(s3),
            ),
            new PrepararEntradaNodoActualService(),
          ),
        );
        return caso.execute(idSesion, idUsuario);
      },
      { isolationLevel: 'RepeatableRead', maxWait: 30000, timeout: 30000 },
    );
  } finally {
    assert.deepEqual(
      await snapshot(),
      antes,
      'RF-26 no debe cambiar datos conversacionales.',
    );
  }
}

async function seed() {
  for (const id of [ids.usuario, ids.otroUsuario, ids.actor])
    await sql.query('INSERT INTO usuario.usuarios (id_usuario) VALUES ($1)', [
      id,
    ]);
  for (const [id, state, version] of [
    [ids.flujoOriginal, 'ARCHIVADO', 1],
    [ids.flujoNuevo, 'PUBLICADO', 2],
  ]) {
    await sql.query(
      "INSERT INTO chat.flujo_conversacion (id_flujo, nombre, modalidad, estado, version, creado_por) VALUES ($1, 'RF-26 local', 'GRUPAL', $2, $3, $4)",
      [id, state, version, ids.actor],
    );
  }
  await sql.query(
    "INSERT INTO chat.tipo_nodo (id_tipo_nodo, nombre) VALUES ($1, 'MENSAJE')",
    [ids.tipo],
  );
  for (const [id, flujo, order, initial, payload] of [
    [
      ids.primero,
      ids.flujoOriginal,
      1,
      true,
      { texto: 'No devolver el primer nodo' },
    ],
    [ids.actual, ids.flujoOriginal, 2, false, contenido],
    [
      ids.siguiente,
      ids.flujoOriginal,
      3,
      false,
      { texto: 'No adelantar al siguiente nodo' },
    ],
    [
      ids.nuevoPublicado,
      ids.flujoNuevo,
      1,
      true,
      { texto: 'No sustituir por la nueva versión publicada' },
    ],
  ]) {
    await sql.query(
      'INSERT INTO chat.nodos (id_nodo, id_flujo, id_tipo_nodo, contenido, orden, es_nodo_inicial, creado_por) VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7)',
      [id, flujo, ids.tipo, JSON.stringify(payload), order, initial, ids.actor],
    );
  }
  for (const [id, owner, node, state] of [
    [ids.sesion, ids.usuario, ids.actual, 'PAUSADA'],
    [ids.sesionAjena, ids.otroUsuario, ids.primero, 'ACTIVA'],
    [ids.sesionInconsistente, ids.usuario, ids.nuevoPublicado, 'ACTIVA'],
    [ids.sesionError, ids.usuario, null, 'ERROR_CONFIGURACION'],
  ]) {
    const error = state === 'ERROR_CONFIGURACION';
    await sql.query(
      "INSERT INTO chat.sesiones (id_sesion, id_usuario, id_flujo_conversacional, version_arbol_utilizada, modalidad_activa, id_nodo_actual) VALUES ($1,$2,$3,$4,'GRUPAL',$5)",
      [id, owner, error ? null : ids.flujoOriginal, error ? null : 1, node],
    );
    await sql.query(
      'INSERT INTO chat.estado_sesiones (id_sesion, estado_actual) VALUES ($1,$2)',
      [id, state],
    );
  }
}

async function main() {
  await sql.connect();
  const count = await sql.query(
    "SELECT COUNT(*)::int AS total FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema')",
  );
  assert.equal(count.rows[0].total, 0, 'No se modifica una base preexistente.');
  for (const file of ['schema-hu05.sql', 'schema-rf26.sql'])
    await sql.query(
      readFileSync(resolve(__dirname, '../fixtures', file), 'utf8'),
    );
  await seed();
  const respuesta = await leer(ids.sesion);
  assert.equal(respuesta.idSesion, ids.sesion);
  assert.equal(respuesta.estadoSesion, 'PAUSADA');
  assert.equal(respuesta.nodo.idNodo, ids.actual);
  assert.deepEqual(
    respuesta.nodo.bloques.map((b) => b.tipo),
    ['TEXTO', 'INSTRUCCION', 'IMAGEN', 'IMAGEN'],
  );
  assert.equal(respuesta.nodo.bloques[0].texto, contenido.texto);
  pass(
    'recupera solo el nodo actual y su JSON en una transacción SQL READ ONLY',
  );
  pass(
    'mantiene la sesión pausada y la versión original aunque haya otro árbol publicado',
  );
  await assert.rejects(
    leer(ids.sesionAjena),
    (error) => error.codigo === 'SESION_NO_ENCONTRADA',
  );
  pass('la consulta de persistencia impide leer la sesión de otro estudiante');
  await assert.rejects(
    leer(randomUUID()),
    (error) => error.codigo === 'SESION_NO_ENCONTRADA',
  );
  pass('una sesión inexistente no inicia ni reinicia conversaciones');
  await assert.rejects(
    leer(ids.sesionInconsistente),
    (error) => error.codigo === 'NODO_INEXISTENTE',
  );
  pass('no devuelve contenido de otro flujo ante un puntero inconsistente');
  await assert.rejects(
    leer(ids.sesionError),
    (error) => error.codigo === 'SESION_ERROR_CONFIGURACION',
  );
  pass('un error de configuración no dispara la selección de otro árbol');
  await sql.query(
    'UPDATE chat.sesiones SET id_nodo_actual=$1 WHERE id_sesion=$2',
    [ids.siguiente, ids.sesion],
  );
  const avanzada = await leer(ids.sesion);
  assert.equal(avanzada.nodo.idNodo, ids.siguiente);
  pass(
    'una lectura posterior sigue el puntero persistido, sin recorrer transiciones',
  );
  await sql.query(
    "UPDATE chat.estado_sesiones SET estado_actual='COMPLETADA' WHERE id_sesion=$1",
    [ids.sesion],
  );
  await leer(ids.sesion);
  pass(
    'consulta el último nodo de una sesión completada sin cambiar estado ni fechas',
  );
  await assert.rejects(
    sql.query('UPDATE chat.nodos SET contenido=NULL WHERE id_nodo=$1', [
      ids.siguiente,
    ]),
    (error) => error.code === '23502',
  );
  pass('PostgreSQL rechaza SQL NULL en contenido');
  await sql.query(
    "UPDATE chat.nodos SET contenido='{}'::jsonb WHERE id_nodo=$1",
    [ids.siguiente],
  );
  await assert.rejects(
    leer(ids.sesion),
    (error) => error.getResponse?.().codigo === 'CONTENIDO_NO_DISPONIBLE',
  );
  pass('un objeto vacío no produce un mensaje vacío en el contrato');
  await sql.query(
    "UPDATE chat.nodos SET contenido='null'::jsonb WHERE id_nodo=$1",
    [ids.siguiente],
  );
  await assert.rejects(
    leer(ids.sesion),
    (error) =>
      error.getStatus?.() === 500 &&
      error.getResponse().codigo === 'CONTENIDO_NO_DISPONIBLE',
  );
  pass('trata JSON null como contenido no disponible');
  const idContenido = randomUUID(),
    idRecurso = randomUUID(),
    idModulo = randomUUID();
  await sql.query(
    'INSERT INTO cronograma.contenidos(id_contenido) VALUES($1)',
    [idContenido],
  );
  await sql.query(
    "INSERT INTO cronograma.modulos_sistema VALUES($1,'CHAT','Chat',true)",
    [idModulo],
  );
  await sql.query(
    "INSERT INTO cronograma.recursos_contenido VALUES($1,$2,'IMAGEN',1,null,$3,'image/webp','Imagen de prueba',null)",
    [
      idRecurso,
      idContenido,
      `cronograma/recursos/${idContenido}/${randomUUID()}`,
    ],
  );
  await sql.query(
    'INSERT INTO cronograma.recursos_modulos_destino(id_recurso,id_modulo) VALUES($1,$2)',
    [idRecurso, idModulo],
  );
  await sql.query(
    'UPDATE chat.nodos SET contenido=$1::jsonb,id_contenido_cronograma=$2 WHERE id_nodo=$3',
    [
      JSON.stringify({ bloques: [{ orden: 1, tipo: 'IMAGEN', idRecurso }] }),
      idContenido,
      ids.siguiente,
    ],
  );
  const privado = await leer(ids.sesion);
  assert.ok(
    new URL(privado.nodo.bloques[0].url).searchParams.has('X-Amz-Signature'),
  );
  assert.ok(Date.parse(privado.nodo.bloques[0].expiraEn) > Date.now());
  pass(
    'consulta recursos asignados a Chat y firma una URL GET sin escribir en la transacción',
  );
  await sql.query(
    'UPDATE chat.sesiones SET id_nodo_actual=$1 WHERE id_sesion=$2',
    [ids.siguiente, ids.sesionAjena],
  );
  const deOtro = await leer(ids.sesionAjena, ids.otroUsuario);
  assert.equal(deOtro.nodo.bloques[0].tipo, 'IMAGEN');
  pass(
    'dos estudiantes autorizados pueden leer el mismo recurso desde sus propias sesiones',
  );
  await sql.query(
    'UPDATE cronograma.modulos_sistema SET activo=false WHERE id_modulo=$1',
    [idModulo],
  );
  await assert.rejects(
    leer(ids.sesion),
    (error) => error.getResponse?.().codigo === 'CONTENIDO_NO_DISPONIBLE',
  );
  pass('un recurso sin módulo Chat activo no se firma');
  console.log(
    JSON.stringify({
      passed: checks,
      failed: 0,
      database: 'PostgreSQL local desechable',
      readOnly: true,
    }),
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    s3.destroy();
    await prisma.$disconnect();
    await sql.end();
  });
