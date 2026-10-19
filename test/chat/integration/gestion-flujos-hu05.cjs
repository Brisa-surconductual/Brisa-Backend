// Integra el repositorio real con un clúster PostgreSQL nuevo y local.
// No carga config/.env ni acepta URLs externas. Borra solo su directorio temporal.
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
  PrismaArbolConversacionalRepository,
} = require('../../../src/modules/chat/infrastructure/persistence/prisma-arbol-conversacional.repository.ts');
const root = path.resolve(__dirname, '../../..');
const bin =
  process.env.HU05_PG_BIN ??
  (process.platform === 'win32'
    ? 'C:/Program Files/PostgreSQL/18/bin'
    : '/usr/lib/postgresql/18/bin');
assert.ok(path.isAbsolute(bin), 'HU05_PG_BIN debe ser una ruta absoluta.');
const tmp = path.join(root, '.tmp');
fs.mkdirSync(tmp, { recursive: true });
const temporaryRoot = fs.realpathSync(os.tmpdir());
// Evitar miles de archivos de PostgreSQL dentro de OneDrive.
const directory = fs.mkdtempSync(path.join(temporaryRoot, 'brisa-hu05-pg-'));
const data = path.join(directory, 'data');
const password = randomBytes(32).toString('hex');
const passwordFile = path.join(directory, 'password');
fs.writeFileSync(passwordFile, password, { mode: 0o600 });
const cli = (name, args) =>
  execFileSync(
    path.join(bin, name + (process.platform === 'win32' ? '.exe' : '')),
    args,
    // pg_ctl deja un servidor en segundo plano: no heredar pipes que impidan
    // terminar execFileSync en Windows. El servidor escribe en server.log.
    {
      stdio: 'ignore',
      timeout: name === 'initdb' ? 300000 : 120000,
      windowsHide: true,
    },
  );
let started = false;
let client, prisma;
let phase = 'inicialización local';
const checks = [];
const passed = (name) => {
  checks.push(name);
  console.log('PASS ' + name);
};
const actor = randomUUID();
const tipo = randomUUID();
const contenido = randomUUID();
async function main() {
  fs.writeFileSync(
    path.join(tmp, 'hu05-integration.json'),
    JSON.stringify({ status: 'RUNNING', checks: 0, failed: null }),
  );
  const reservation = net.createServer();
  await new Promise((done, reject) => {
    reservation.once('error', reject);
    reservation.listen(0, '127.0.0.1', done);
  });
  const port = reservation.address().port;
  await new Promise((done) => reservation.close(done));
  phase = 'initdb local';
  console.log('Inicializando PostgreSQL temporal fuera de OneDrive.');
  cli('initdb', [
    '-D',
    data,
    '-U',
    'postgres',
    '--auth=scram-sha-256',
    '--pwfile=' + passwordFile,
    '--encoding=UTF8',
    '--locale=C',
    '--no-sync',
  ]);
  started = true;
  phase = 'arranque local';
  console.log('Iniciando el servidor de prueba en el puerto local reservado.');
  cli('pg_ctl', [
    'start',
    '-D',
    data,
    '-l',
    path.join(directory, 'server.log'),
    '-o',
    '-h 127.0.0.1 -p ' + port,
    '-w',
    '-t',
    '45',
  ]);
  fs.unlinkSync(passwordFile);
  const connectionString =
    'postgresql://postgres:' + password + '@127.0.0.1:' + port + '/postgres';
  client = new Client({
    connectionString,
    connectionTimeoutMillis: 10000,
    query_timeout: 20000,
  });
  await client.connect();
  await client.query(
    fs.readFileSync(
      path.join(root, 'test/chat/fixtures/schema-hu05.sql'),
      'utf8',
    ),
  );
  for (const migration of [
    '20260930120000_arboles_personalizados_rf25c',
    '20261017190000_auditoria_reglas_validacion_hu03',
  ]) {
    await client.query(
      fs.readFileSync(
        path.join(root, 'prisma/migrations', migration, 'migration.sql'),
        'utf8',
      ),
    );
  }
  await client.query('INSERT INTO usuario.usuarios VALUES ($1)', [actor]);
  await client.query('INSERT INTO cronograma.contenidos VALUES ($1)', [
    contenido,
  ]);
  await client.query("INSERT INTO chat.tipo_nodo VALUES ($1,'MENSAJE')", [
    tipo,
  ]);
  prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  const repo = new PrismaArbolConversacionalRepository(prisma);
  const perfil = { tipoDependencia: 'TOLERANCIA', tipoCraving: 'NEGATIVO' };
  const otroPerfil = {
    tipoDependencia: 'ABSTINENCIA_FISICA',
    tipoCraving: 'NEGATIVO',
  };
  const create = (combination = perfil) =>
    repo.crearFlujoPersonalizado({
      nombre: 'Integración HU05',
      ...combination,
      creadoPor: actor,
    });
  async function graph(id) {
    const nodo = (inicial, orden) =>
      repo.crearNodo({
        idFlujo: id,
        idTipoNodo: tipo,
        contenido: { texto: inicial ? 'Inicio' : 'Fin' },
        esNodoInicial: inicial,
        orden,
        idContenidoCronograma: inicial ? contenido : null,
        creadoPor: actor,
      });
    const a = await nodo(true, 1),
      b = await nodo(false, 2);
    const rule = await repo.crearReglaValidacion({
      tipoDato: 'TEXTO',
      obligatorio: true,
      valorMin: null,
      valorMax: null,
      formatoRegex: null,
      valoresPermitidos: [],
      mensajeError: 'Respuesta requerida',
      creadoPor: actor,
    });
    await repo.crearTransicion({
      idFlujo: id,
      idNodoOrigen: a.idNodo,
      idNodoDestino: b.idNodo,
      idReglaValidacion: rule.idReglaValidacion,
      operadorCondicion: 'IGUALDAD',
      valorCondicion: { valor: 'si' },
      ordenEvaluacion: 1,
      creadoPor: actor,
    });
    return { a, b, rule };
  }
  const count = async () =>
    (
      await client.query(
        'SELECT (SELECT count(*)::int FROM chat.flujo_conversacion) flujos, (SELECT count(*)::int FROM chat.nodos) nodos, (SELECT count(*)::int FROM chat.reglas_nodos) transiciones, (SELECT count(*)::int FROM chat.auditoria_arboles) auditorias',
      )
    ).rows[0];
  phase = 'creación, publicación concurrente y archivado';
  const a = await create(),
    b = await create();
  assert.equal(a.version, 1);
  assert.equal(b.version, 2);
  assert.equal(a.estado, 'BORRADOR');
  assert.equal(a.tipoDependencia, perfil.tipoDependencia);
  assert.equal(a.tipoCraving, perfil.tipoCraving);
  assert.equal(a.creadoPor, actor);
  passed('varios borradores del mismo perfil, versiones y actor de creación');
  await graph(a.idFlujo);
  await graph(b.idFlujo);
  const concurrent = await Promise.allSettled([
    repo.publicarAdministrativo(a.idFlujo, actor),
    repo.publicarAdministrativo(b.idFlujo, actor),
  ]);
  const wins = concurrent.filter((r) => r.status === 'fulfilled');
  const losses = concurrent.filter((r) => r.status === 'rejected');
  assert.equal(wins.length, 1);
  assert.equal(losses.length, 1);
  const winner = wins[0].value;
  const loser = winner.idFlujo === a.idFlujo ? b : a;
  assert.equal(losses[0].reason.getStatus(), 409);
  assert.equal(losses[0].reason.getResponse().codigo, 'YA_EXISTE_PUBLICADO');
  assert.equal(
    losses[0].reason.getResponse().detalles.id_flujo_publicado,
    winner.idFlujo,
  );
  assert.equal(
    (
      await client.query(
        "SELECT count(*)::int n FROM chat.flujo_conversacion WHERE estado='PUBLICADO'",
      )
    ).rows[0].n,
    1,
  );
  passed('dos publicaciones simultáneas: un ganador y un 409 con su UUID');
  const original = await repo.obtenerArbol(winner.idFlujo);
  const archived = await repo.archivarAdministrativo(winner.idFlujo, actor);
  assert.ok(archived.fechaArchivado);
  assert.ok(archived.fechaPublicacion);
  const after = await repo.obtenerArbol(winner.idFlujo);
  assert.deepEqual(
    after.nodos.map((n) => n.idNodo),
    original.nodos.map((n) => n.idNodo),
  );
  assert.deepEqual(
    after.transiciones.map((t) => t.idTransicion),
    original.transiciones.map((t) => t.idTransicion),
  );
  await repo.publicarAdministrativo(loser.idFlujo, actor);
  passed(
    'archivar conserva nodos y transiciones y libera el índice para otra publicación',
  );
  const other = await create(otroPerfil);
  await graph(other.idFlujo);
  await repo.publicarAdministrativo(other.idFlujo, actor);
  passed(
    'combinaciones clínicas distintas pueden estar publicadas simultáneamente',
  );

  phase = 'clonación y compatibilidad grupal';
  // El origen v1 tiene v2 ocupada; el contrato estricto no debe asignar v3 silenciosamente.
  await assert.rejects(
    repo.clonarVersion(a.idFlujo, actor),
    (e) => e.getStatus() === 409,
  );
  const source = await repo.obtenerArbol(other.idFlujo);
  const cloned = await repo.clonarVersion(other.idFlujo, actor);
  assert.equal(cloned.flujo.version, other.version + 1);
  assert.equal(cloned.flujo.estado, 'BORRADOR');
  assert.notEqual(cloned.flujo.idFlujo, other.idFlujo);
  assert.equal(cloned.nodosCopiados, 2);
  assert.equal(cloned.transicionesCopiadas, 1);
  const copy = await repo.obtenerArbol(cloned.flujo.idFlujo);
  const datosNodo = (nodo) => [
    nodo.idTipoNodo,
    nodo.contenido,
    nodo.esNodoInicial,
    nodo.orden,
    nodo.idContenidoCronograma,
  ];
  assert.deepEqual(copy.nodos.map(datosNodo), source.nodos.map(datosNodo));
  assert.equal(
    copy.nodos.find((nodo) => nodo.esNodoInicial).idContenidoCronograma,
    contenido,
  );
  assert.ok(
    copy.nodos.every(
      (n) => !source.nodos.some((old) => old.idNodo === n.idNodo),
    ),
  );
  assert.equal(
    copy.transiciones[0].reglaValidacion.idReglaValidacion,
    source.transiciones[0].reglaValidacion.idReglaValidacion,
  );
  assert.deepEqual(
    copy.transiciones[0].valorCondicion,
    source.transiciones[0].valorCondicion,
  );
  assert.equal(
    copy.transiciones[0].ordenEvaluacion,
    source.transiciones[0].ordenEvaluacion,
  );
  assert.ok(
    copy.nodos.some(
      (n) => n.idNodo === copy.transiciones[0].idNodoOrigen && n.esNodoInicial,
    ),
  );
  assert.ok(
    copy.nodos.some((n) => n.idNodo === copy.transiciones[0].idNodoDestino),
  );
  passed(
    'clon origen + 1 con UUID nuevos, nodos remapeados y reglas reutilizadas',
  );
  await repo.archivarAdministrativo(cloned.flujo.idFlujo, actor);
  await assert.rejects(
    repo.archivarAdministrativo(cloned.flujo.idFlujo, actor),
    (e) => e.getResponse().codigo === 'ESTADO_INVALIDO',
  );
  const fromArchived = await repo.clonarVersion(cloned.flujo.idFlujo, actor);
  assert.equal(fromArchived.flujo.version, 3);
  passed(
    'archivado desde borrador, rechazo de repetición y clonación desde archivado',
  );
  const group = await repo.crearFlujoGrupal({
    nombre: 'Grupal HU05',
    version: 1,
    creadoPor: actor,
  });
  await graph(group.idFlujo);
  await repo.publicarAdministrativo(group.idFlujo, actor);
  const groupClone = await repo.clonarVersion(group.idFlujo, actor);
  assert.equal(groupClone.flujo.modalidad, 'GRUPAL');
  assert.equal(groupClone.flujo.tipoDependencia, null);
  assert.equal(groupClone.flujo.version, 2);
  await assert.rejects(
    repo.publicarAdministrativo(groupClone.flujo.idFlujo, actor),
    (error) => error.getStatus() === 409,
  );
  passed(
    'publicación y clonación grupal conservan modalidad sin perfil clínico',
  );
  await assert.rejects(
    repo.publicarAdministrativo(group.idFlujo, actor),
    (e) => e.getResponse().codigo === 'ESTADO_INVALIDO',
  );
  await assert.rejects(
    repo.clonarVersion(groupClone.flujo.idFlujo, actor),
    (e) => e.getResponse().codigo === 'ESTADO_INVALIDO',
  );
  passed('estado inválido bloquea republicación y clonación de borradores');

  phase = 'validación de grafos y filtros';
  const noInitial = await create();
  await assert.rejects(
    repo.publicarAdministrativo(noInitial.idFlujo, actor),
    (e) => e.getStatus() === 422 && e.getResponse().detalles.sin_nodo_inicial,
  );
  const broken = await create();
  const brokenGraph = await graph(broken.idFlujo);
  await client.query(
    "INSERT INTO chat.reglas_nodos(id_flujo,id_nodo_origen,id_nodo_destino,id_regla_validacion,operador_condicion,valor_condicion,orden_evaluacion) VALUES ($1,$2,$3,$4,'IGUALDAD','{}',1)",
    [
      broken.idFlujo,
      brokenGraph.b.idNodo,
      brokenGraph.a.idNodo,
      brokenGraph.rule.idReglaValidacion,
    ],
  );
  await assert.rejects(
    repo.publicarAdministrativo(broken.idFlujo, actor),
    (e) =>
      e.getResponse().codigo === 'GRAFO_INVALIDO' &&
      e.getResponse().detalles.ciclos.length > 0,
  );
  const orphan = await create();
  await graph(orphan.idFlujo);
  const detached = await repo.crearNodo({
    idFlujo: orphan.idFlujo,
    idTipoNodo: tipo,
    contenido: {},
    esNodoInicial: false,
    orden: 3,
    idContenidoCronograma: null,
    creadoPor: actor,
  });
  await assert.rejects(
    repo.publicarAdministrativo(orphan.idFlujo, actor),
    (e) => e.getResponse().detalles.nodos_huerfanos.includes(detached.idNodo),
  );
  passed(
    '422 con detalles reales para ausencia de inicio, ciclos y nodos huérfanos',
  );
  const allRows = (await client.query('SELECT * FROM chat.flujo_conversacion'))
    .rows;
  const filters = [
    {},
    { modalidad: 'GRUPAL' },
    { modalidad: 'PERSONALIZADA' },
    { tipoDependencia: 'TOLERANCIA' },
    { tipoCraving: 'NEGATIVO' },
    { estado: 'ARCHIVADO' },
    {
      modalidad: 'PERSONALIZADA',
      tipoDependencia: 'TOLERANCIA',
      tipoCraving: 'NEGATIVO',
      estado: 'BORRADOR',
    },
  ];
  for (const filter of filters) {
    const matches = allRows.filter(
      (row) =>
        (filter.modalidad === undefined ||
          row.modalidad === filter.modalidad) &&
        (filter.tipoDependencia === undefined ||
          row.tipo_dependencia === filter.tipoDependencia) &&
        (filter.tipoCraving === undefined ||
          row.tipo_craving === filter.tipoCraving) &&
        (filter.estado === undefined || row.estado === filter.estado),
    );
    const result = await repo.listarFlujos({ ...filter, page: 1, pageSize: 1 });
    assert.equal(result.total, matches.length);
    assert.equal(result.items.length, Math.min(1, matches.length));
  }
  const page1 = await repo.listarFlujos({ page: 1, pageSize: 1 });
  const page2 = await repo.listarFlujos({ page: 2, pageSize: 1 });
  assert.notEqual(page1.items[0].idFlujo, page2.items[0].idFlujo);
  assert.equal(
    (await repo.listarFlujos({ page: 1000, pageSize: 20 })).total,
    allRows.length,
  );
  passed(
    'filtros individuales y combinados, conteo antes de paginar y páginas sin repetición',
  );

  phase = 'rollback físico';
  // Fuente archivada v2: v3 ya existe, por eso usar el grupal (no tiene unicidad de versión por perfil).
  await client.query(
    "CREATE FUNCTION chat.hu05_fallar() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fallo controlado HU05'; END; $$; CREATE TRIGGER hu05_fallo BEFORE INSERT ON chat.reglas_nodos FOR EACH ROW EXECUTE FUNCTION chat.hu05_fallar()",
  );
  const beforeCopy = await count();
  await assert.rejects(repo.clonarVersion(group.idFlujo, actor));
  assert.deepEqual(await count(), beforeCopy);
  await client.query('DROP TRIGGER hu05_fallo ON chat.reglas_nodos');
  passed(
    'fallo durante copia de transiciones revierte flujo, nodos y auditoría del clon',
  );
  await repo.archivarAdministrativo(loser.idFlujo, actor);
  const candidate = await create();
  await graph(candidate.idFlujo);
  await client.query(
    'CREATE TRIGGER hu05_fallo BEFORE INSERT ON chat.auditoria_arboles FOR EACH ROW EXECUTE FUNCTION chat.hu05_fallar()',
  );
  const beforeAudit = await count();
  await assert.rejects(repo.clonarVersion(group.idFlujo, actor));
  assert.deepEqual(await count(), beforeAudit);
  await assert.rejects(repo.publicarAdministrativo(candidate.idFlujo, actor));
  await assert.rejects(repo.archivarAdministrativo(other.idFlujo, actor));
  assert.equal(
    (await repo.obtenerArbol(candidate.idFlujo)).flujo.estado,
    'BORRADOR',
  );
  assert.equal(
    (await repo.obtenerArbol(candidate.idFlujo)).flujo.fechaPublicacion,
    null,
  );
  assert.equal(
    (await repo.obtenerArbol(other.idFlujo)).flujo.estado,
    'PUBLICADO',
  );
  assert.equal(
    (await repo.obtenerArbol(other.idFlujo)).flujo.fechaArchivado,
    null,
  );
  assert.deepEqual(await count(), beforeAudit);
  await client.query(
    'DROP TRIGGER hu05_fallo ON chat.auditoria_arboles; DROP FUNCTION chat.hu05_fallar()',
  );
  passed(
    'fallo de auditoría revierte clonación, publicación y archivado con sus fechas',
  );

  phase = 'índice parcial y regresión';
  const rawProfile = {
    tipoDependencia: 'ABSTINENCIA_FISICA',
    tipoCraving: 'POSITIVO',
  };
  const rawA = await create(rawProfile),
    rawB = await create(rawProfile);
  const rawClients = [
    new Client({ connectionString }),
    new Client({ connectionString }),
  ];
  try {
    await Promise.all(rawClients.map((c) => c.connect()));
    await Promise.all(rawClients.map((c) => c.query('BEGIN')));
    const rawResults = await Promise.allSettled(
      rawClients.map(async (c, i) => {
        try {
          await c.query(
            "UPDATE chat.flujo_conversacion SET estado='PUBLICADO' WHERE id_flujo=$1",
            [i === 0 ? rawA.idFlujo : rawB.idFlujo],
          );
          await c.query('COMMIT');
        } catch (error) {
          await c.query('ROLLBACK');
          throw error;
        }
      }),
    );
    assert.equal(rawResults.filter((r) => r.status === 'fulfilled').length, 1);
    assert.equal(
      rawResults.find((r) => r.status === 'rejected').reason.code,
      '23505',
    );
  } finally {
    await Promise.allSettled(rawClients.map((c) => c.end()));
  }
  passed(
    'el índice parcial impide dos publicados incluso con SQL concurrente sin chequeo previo',
  );
  assert.equal(await repo.buscarPublicadoPersonalizado(perfil), null);
  const legacy = await create(otroPerfil);
  await graph(legacy.idFlujo);
  await repo.publicarPersonalizado(legacy.idFlujo, actor);
  assert.equal(
    (await repo.obtenerArbol(other.idFlujo)).flujo.estado,
    'ARCHIVADO',
  );
  assert.equal(
    (await repo.buscarPublicadoPersonalizado(otroPerfil)).idFlujo,
    legacy.idFlujo,
  );
  passed(
    'consulta de vigente y publicación anterior con archivado automático siguen compatibles',
  );
  const events = (
    await client.query('SELECT DISTINCT accion FROM chat.auditoria_arboles')
  ).rows.map((r) => r.accion);
  for (const event of ['CREAR_FLUJO', 'CLONAR_VERSION', 'PUBLICAR', 'ARCHIVAR'])
    assert.ok(events.includes(event));
  await assert.rejects(
    client.query('UPDATE chat.auditoria_arboles SET id_actor=$1', [actor]),
    { code: 'P0001' },
  );
  await assert.rejects(client.query('DELETE FROM chat.auditoria_arboles'), {
    code: 'P0001',
  });
  await assert.rejects(
    repo.crearFlujoPersonalizado({
      nombre: 'FK',
      ...perfil,
      creadoPor: randomUUID(),
    }),
    (e) => e.code === 'P2003',
  );
  passed('eventos de auditoría, inmutabilidad y FK de actor verificados');
  fs.writeFileSync(
    path.join(tmp, 'hu05-integration.json'),
    JSON.stringify(
      {
        checks: checks.length,
        status: 'PASSED',
        failed: 0,
        database: 'PostgreSQL local aislado',
        checksPassed: checks,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ checks: checks.length, failed: 0 }));
}
main()
  .catch((error) => {
    fs.writeFileSync(
      path.join(tmp, 'hu05-integration.json'),
      JSON.stringify({
        status: 'FAILED',
        phase,
        checks: checks.length,
        failed: 1,
      }),
    );
    console.error(
      JSON.stringify({
        phase,
        code: error.code || error.name,
        message:
          error instanceof assert.AssertionError ? error.message : undefined,
      }),
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.allSettled([prisma?.$disconnect(), client?.end()]);
    try {
      if (started)
        cli('pg_ctl', ['stop', '-D', data, '-m', 'fast', '-w', '-t', '45']);
      // Verificar el destino absoluto antes de eliminar recursivamente en Windows.
      assert.equal(path.dirname(fs.realpathSync(directory)), temporaryRoot);
      assert.ok(path.basename(directory).startsWith('brisa-hu05-pg-'));
      fs.rmSync(directory, { recursive: true, maxRetries: 5, retryDelay: 200 });
      console.log('Clúster temporal detenido y eliminado.');
    } catch {
      fs.writeFileSync(
        path.join(tmp, 'hu05-integration.json'),
        JSON.stringify({
          status: 'FAILED',
          phase: 'cleanup',
          checks: checks.length,
          failed: 1,
        }),
      );
      console.error(
        'No se pudo confirmar la limpieza del clúster local: ' + directory,
      );
      process.exitCode = 1;
    }
  });
