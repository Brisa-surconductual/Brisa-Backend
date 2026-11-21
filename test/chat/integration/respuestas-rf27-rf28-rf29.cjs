// Base local vacía y desechable. Nunca carga config/.env.
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
const connection = process.env.RF27_TEST_DATABASE_URL;
assert.ok(
  connection,
  'Define RF27_TEST_DATABASE_URL para una base local vacía.',
);
const url = new URL(connection);
assert.ok(
  ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname),
  'Solo PostgreSQL local.',
);
assert.match(url.pathname, /^\/brisa_rf27_test_[a-z0-9_]+$/);
process.env.DATABASE_URL = connection;
const source = (name) =>
  require(resolve(__dirname, '../../../src/modules/chat', name));
const { PrismaService } = require('../../../prisma/prisma.service.ts');
const { PrismaProcesarRespuestaRepository } = source(
  'infrastructure/persistence/prisma-procesar-respuesta.repository.ts',
);
const { ProcesarRespuestaUseCase } = source(
  'application/use-cases/sesion/procesar-respuesta.use-case.ts',
);
const { EstadoConversacionalService } = source(
  'application/services/estado-conversacional.service.ts',
);
const { PrismaHistorialInteraccionesRepository } = source(
  'infrastructure/persistence/prisma-historial-interacciones.repository.ts',
);
const { PrismaRecuperarSesionConversacionalRepository } = source(
  'infrastructure/persistence/prisma-recuperar-sesion-conversacional.repository.ts',
);
const { PrismaSesionConversacionalRepository } = source(
  'infrastructure/persistence/prisma-sesion-conversacional.repository.ts',
);
const { RecuperarSesionConversacionalService } = source(
  'application/services/recuperar-sesion-conversacional.service.ts',
);
const { SesionConversacional } = source(
  'domain/entities/sesion/sesion-conversacional.entity.ts',
);
const { IniciarOReanudarSesionUseCase } = source(
  'application/use-cases/sesion/iniciar-o-reanudar-sesion.use-case.ts',
);
const { PresentarHistorialConversacionalService } = source(
  'application/services/presentar-historial-conversacional.service.ts',
);
const { presentadorNodoPrueba } = source(
  'application/support/testing/presentacion-nodo.fixture.ts',
);
const { PrismaArbolConversacionalRepository } = source(
  'infrastructure/persistence/prisma-arbol-conversacional.repository.ts',
);
const { PrismaPresentacionNodoActualRepository } = source(
  'infrastructure/persistence/prisma-presentacion-nodo-actual.repository.ts',
);
const { FormatoRespuestaAdapter } = source(
  'infrastructure/validation/formato-respuesta.adapter.ts',
);
const prisma = new PrismaService();
const sql = new Client({ connectionString: connection });
const persistencia = new PrismaProcesarRespuestaRepository(prisma);
const historial = new PrismaHistorialInteraccionesRepository(prisma);
const recuperar = new RecuperarSesionConversacionalService(
  new PrismaRecuperarSesionConversacionalRepository(prisma, historial),
);
const sesiones = new PrismaSesionConversacionalRepository(prisma);
const arboles = new PrismaArbolConversacionalRepository(prisma);
const presentador = presentadorNodoPrueba(
  new PrismaPresentacionNodoActualRepository(prisma),
);
const casoInicio = (determinarContexto) =>
  new IniciarOReanudarSesionUseCase(
    sesiones,
    arboles,
    { execute: determinarContexto },
    {
      execute: () =>
        Promise.resolve({
          id_unidad_temporal: null,
          nombre_unidad: null,
          cronograma_finalizado: false,
        }),
    },
    { existeAsignacion: () => Promise.resolve(true) },
    recuperar,
    presentador,
    new PresentarHistorialConversacionalService(arboles, presentador),
  );
const iniciar = casoInicio(() =>
  Promise.reject(new Error('No debe elegir un árbol nuevo al recuperar')),
);
const caso = new ProcesarRespuestaUseCase(
  persistencia,
  new FormatoRespuestaAdapter(),
  new EstadoConversacionalService(),
);
const usuario = randomUUID(),
  otroUsuario = randomUUID(),
  tipoPregunta = randomUUID(),
  tipoMensaje = randomUUID();
let passed = 0,
  failed = 0;
const q = (query, values) => sql.query(query, values);
async function check(nombre, prueba) {
  try {
    await prueba();
    passed++;
    process.stdout.write(`OK ${nombre}\n`);
  } catch (error) {
    failed++;
    process.stderr.write(`FAIL ${nombre}: ${error.stack}\n`);
  }
}
function codigo(error) {
  return error.getResponse?.().codigo ?? error.codigo;
}
async function rechaza(promesa, esperado) {
  await assert.rejects(promesa, (error) =>
    esperado === undefined
      ? error.getStatus?.() === 500
      : codigo(error) === esperado,
  );
}
async function crear({
  tipo = 'NUMERICO',
  valor = 5,
  tipoDato = 'NUMERICO',
  permitido = [],
  obligatorio = true,
  condicion = { min: 0, max: 10 },
  operador = 'RANGO',
  estado = 'ACTIVA',
  regla = true,
  personalizado = false,
  regex = null,
  destinoAjeno = false,
  destinoTerminal = false,
  captura = null,
  capturaLegada = false,
} = {}) {
  const flujo = randomUUID(),
    nodo = randomUUID(),
    destino = randomUUID(),
    validacion = randomUUID(),
    sesion = randomUUID();
  await q(
    `INSERT INTO chat.flujo_conversacion(id_flujo,nombre,modalidad,tipo_dependencia,tipo_craving,estado,version,creado_por)
    VALUES($1,'Árbol de prueba',$2,$3,$4,'ARCHIVADO',1,$5)`,
    [
      flujo,
      personalizado ? 'PERSONALIZADA' : 'GRUPAL',
      personalizado ? 'TOLERANCIA' : null,
      personalizado ? 'POSITIVO' : null,
      usuario,
    ],
  );
  const contenido = {
    texto: 'Contenido intacto',
    instrucciones: 'Instrucción',
    entrada: {
      tipo_entrada: tipo,
      ...(tipoDato === 'NUMERICO' && { min: 0, max: 10 }),
      ...([
        'OPCION_UNICA',
        'SELECCION_UNICA',
        'MULTISELECCION',
        'SELECCION_MULTIPLE',
      ].includes(tipo) && { opciones: permitido }),
    },
    ...(captura !== null &&
      (capturaLegada
        ? { captura_perfil: captura }
        : {
            capturaPerfil: {
              dimension:
                captura === 'tipo_dependencia'
                  ? 'TIPO_DEPENDENCIA'
                  : 'TIPO_CRAVING',
            },
          })),
  };
  await q(
    `INSERT INTO chat.nodos(id_nodo,id_flujo,id_tipo_nodo,contenido,creado_por) VALUES($1,$2,$3,$4,$5)`,
    [nodo, flujo, tipoPregunta, contenido, usuario],
  );
  let flujoDestino = flujo;
  if (destinoAjeno) {
    flujoDestino = randomUUID();
    await q(
      `INSERT INTO chat.flujo_conversacion(id_flujo,nombre,modalidad,version,creado_por) VALUES($1,'Otro','GRUPAL',1,$2)`,
      [flujoDestino, usuario],
    );
  }
  await q(
    `INSERT INTO chat.nodos(id_nodo,id_flujo,id_tipo_nodo,contenido,creado_por) VALUES($1,$2,$3,$4,$5)`,
    [
      destino,
      flujoDestino,
      tipoMensaje,
      {
        texto: 'Fin',
        multimedia: [{ url: 'https://example.test/recurso.png' }],
      },
      usuario,
    ],
  );
  if (regla && tipo !== 'CONTINUAR') {
    await q(
      `INSERT INTO chat.reglas_validaciones(id_regla_validacion,tipo_dato,obligatorio,valor_min,valor_max,formato_regex,valores_permitidos,mensaje_error,operador_condicion,valor_esperado)
      VALUES($1,$2,$3,$4,$5,$6,$7,'Respuesta fuera de lo permitido',$8,$9)`,
      [
        validacion,
        tipoDato,
        obligatorio,
        tipoDato === 'NUMERICO' ? 0 : null,
        tipoDato === 'NUMERICO' ? 10 : null,
        regex,
        permitido,
        operador,
        condicion,
      ],
    );
  }
  if (regla) {
    await q(
      `INSERT INTO chat.reglas_nodos(id_flujo,id_nodo_origen,id_nodo_destino,id_regla_validacion,orden_evaluacion)
      VALUES($1,$2,$3,$4,1)`,
      [flujo, nodo, destino, tipo === 'CONTINUAR' ? null : validacion],
    );
  }
  if (!destinoTerminal) {
    const fin = randomUUID();
    await q(
      `INSERT INTO chat.nodos(id_nodo,id_flujo,id_tipo_nodo,contenido,creado_por) VALUES($1,$2,$3,$4,$5)`,
      [fin, flujoDestino, tipoMensaje, { texto: 'Final' }, usuario],
    );
    await q(
      `INSERT INTO chat.reglas_nodos(id_flujo,id_nodo_origen,id_nodo_destino,orden_evaluacion) VALUES($1,$2,$3,1)`,
      [flujoDestino, destino, fin],
    );
  }
  await q(
    `INSERT INTO chat.sesiones(id_sesion,id_usuario,id_flujo_conversacional,version_arbol_utilizada,modalidad_activa,tipo_dependencia,tipo_craving,id_nodo_actual)
    VALUES($1,$2,$3,1,$4,$5,$6,$7)`,
    [
      sesion,
      usuario,
      flujo,
      personalizado ? 'PERSONALIZADA' : 'GRUPAL',
      personalizado ? 'TOLERANCIA' : null,
      personalizado ? 'POSITIVO' : null,
      nodo,
    ],
  );
  await q(
    `INSERT INTO chat.estado_sesiones(id_sesion,estado_actual,fecha_pausa,fecha_completada) VALUES($1,$2,$3,$4)`,
    [
      sesion,
      estado,
      estado === 'PAUSADA' ? new Date() : null,
      estado === 'COMPLETADA' ? new Date() : null,
    ],
  );
  return {
    flujo,
    nodo,
    destino,
    sesion,
    dto: {
      id_nodo: nodo,
      id_interaccion: randomUUID(),
      tipo_entrada:
        {
          SELECCION_UNICA: 'OPCION_UNICA',
          SELECCION_MULTIPLE: 'MULTISELECCION',
        }[tipo] ?? tipo,
      valor,
      timestamp_interaccion: '2026-11-06T11:49:00-05:00',
      secuencia: 1,
      estado_conectividad: 'EN_LINEA',
      recursos_no_presentados: null,
    },
  };
}
async function snapshot(sesion) {
  return (
    await q(
      `SELECT s.*,e.estado_actual,e.fecha_actualizacion,e.fecha_completada,
    (SELECT count(*)::int FROM chat.interacciones) AS interacciones,
    (SELECT count(*)::int FROM chat.respuestas) AS respuestas,
    (SELECT count(*)::int FROM chat.historial_nodos) AS historial,
    (SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY id_usuario),'[]'::jsonb) FROM chat.perfil_clinico p) AS perfiles
    FROM chat.sesiones s JOIN chat.estado_sesiones e USING(id_sesion) WHERE s.id_sesion=$1`,
      [sesion],
    )
  ).rows[0];
}
const enviar = (e) => caso.execute(e.sesion, usuario, e.dto);
async function sinCambios(e, esperado, accion = () => enviar(e)) {
  const antes = await snapshot(e.sesion);
  await rechaza(accion(), esperado);
  assert.deepEqual(await snapshot(e.sesion), antes);
}
const migracion = (nombre) =>
  readFileSync(
    resolve(__dirname, '../../../prisma/migrations', nombre, 'migration.sql'),
    'utf8',
  );
async function historialValido(idSesion) {
  return (
    await q('SELECT chat.fn_validar_historial_sesion($1) AS valido', [idSesion])
  ).rows[0].valido;
}

(async () => {
  try {
    await sql.connect();
    await prisma.$connect();
    assert.equal(
      (
        await q(
          `SELECT count(*)::int AS total FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema')`,
        )
      ).rows[0].total,
      0,
      'Requiere base completamente vacía.',
    );
    await q(
      readFileSync(resolve(__dirname, '../fixtures/schema-hu05.sql'), 'utf8'),
    );
    await q(
      readFileSync(
        resolve(__dirname, '../fixtures/schema-respuestas-rf27.sql'),
        'utf8',
      ),
    );
    await q(`INSERT INTO usuario.usuarios VALUES($1),($2)`, [
      usuario,
      otroUsuario,
    ]);
    await q(`INSERT INTO chat.tipo_nodo VALUES($1,'PREGUNTA'),($2,'MENSAJE')`, [
      tipoPregunta,
      tipoMensaje,
    ]);
    await q(migracion('20261117140000_chat_tipo_dato_validacion_decision'));
    await q(migracion('20261118120000_chat_regla_por_transicion'));
    const catalogosSql = readFileSync(
      resolve(
        __dirname,
        '../../../prisma/migrations/20261105220000_catalogos_respuestas_rf27/migration.sql',
      ),
      'utf8',
    );
    await check(
      'migración de catálogos es idempotente y preserva UUID existentes',
      async () => {
        const idExistente = randomUUID();
        await q(
          `INSERT INTO chat.tipo_entrada(id_tipo_entrada,nombre) VALUES($1,'NUMERICO')`,
          [idExistente],
        );
        await q(catalogosSql);
        await q(catalogosSql);
        assert.equal(
          (
            await q(
              `SELECT id_tipo_entrada FROM chat.tipo_entrada WHERE nombre='NUMERICO'`,
            )
          ).rows[0].id_tipo_entrada,
          idExistente,
        );
        assert.equal(
          (await q(`SELECT count(*)::int AS cantidad FROM chat.tipo_entrada`))
            .rows[0].cantidad,
          7,
        );
        assert.equal(
          (
            await q(
              `SELECT count(*)::int AS cantidad FROM chat.estado_conectividad`,
            )
          ).rows[0].cantidad,
          1,
        );
      },
    );
    await check(
      'migración de resultado conserva respuestas históricas y catálogos',
      async () => {
        const e = await crear(),
          idInteraccion = randomUUID(),
          idRespuesta = randomUUID();
        await q(
          `INSERT INTO chat.interacciones(id_interaccion,id_sesion,id_nodo,secuencia) VALUES($1,$2,$3,1)`,
          [idInteraccion, e.sesion, e.nodo],
        );
        await q(
          `INSERT INTO chat.respuestas(id_respuesta,id_interaccion,id_nodo,id_tipo_entrada,id_estado_conectividad,valor_respuesta)
        SELECT $1,$2,$3,t.id_tipo_entrada,c.id_estado_conectividad,'5'::jsonb FROM chat.tipo_entrada t CROSS JOIN chat.estado_conectividad c WHERE t.nombre='NUMERICO' AND c.nombre='ONLINE'`,
          [idRespuesta, idInteraccion, e.nodo],
        );
        await q(
          readFileSync(
            resolve(
              __dirname,
              '../../../prisma/migrations/20261106220000_resultado_respuesta_idempotente/migration.sql',
            ),
            'utf8',
          ),
        );
        const r = await prisma.respuestas.findUnique({
          where: { id_respuesta: idRespuesta },
        });
        assert.equal(r.valor_respuesta, 5);
        assert.equal(r.resultado_procesamiento, null);
        assert.equal(
          (await q(`SELECT count(*)::int AS n FROM chat.tipo_entrada`)).rows[0]
            .n,
          10,
        );
        assert.equal(
          (await q(`SELECT count(*)::int AS n FROM chat.estado_conectividad`))
            .rows[0].n,
          2,
        );
      },
    );
    await q(
      "INSERT INTO chat.estado_conectividad (nombre) VALUES ('SIN_CONEXION')",
    );
    await q(migracion('20261120230000_chat_validar_historial_rf31'));
    await check(
      'RF-32 repara y reactiva la sesión archivada con sus últimas veinte interacciones',
      async () => {
        const e = await crear();
        const { id_nodo_destino: ultimoOriginal } = (
          await q(
            'SELECT id_nodo_destino FROM chat.reglas_nodos WHERE id_nodo_origen=$1',
            [e.destino],
          )
        ).rows[0];
        const ids = Array.from({ length: 21 }, () => randomUUID());
        await q(
          `INSERT INTO chat.nodos(id_nodo,id_flujo,id_tipo_nodo,contenido,creado_por)
        SELECT id,$2,$3,'{"texto":"Siguiente paso"}'::jsonb,$4 FROM unnest($1::uuid[]) id`,
          [ids, e.flujo, tipoMensaje, usuario],
        );
        await q(
          `INSERT INTO chat.reglas_nodos(id_flujo,id_nodo_origen,id_nodo_destino,orden_evaluacion)
        SELECT $3,origen,destino,1 FROM unnest($1::uuid[],$2::uuid[]) AS pares(origen,destino)`,
          [[ultimoOriginal, ...ids.slice(0, -1)], ids, e.flujo],
        );

        const primera = await enviar(e);
        let paso = primera;
        for (let secuencia = 2; secuencia <= 22; secuencia++) {
          paso = await caso.execute(e.sesion, usuario, {
            ...e.dto,
            id_interaccion: randomUUID(),
            id_nodo: paso.transicion.id_nodo_destino,
            secuencia,
            tipo_entrada: 'CONTINUAR',
            valor: null,
          });
        }

        await q(
          `UPDATE chat.sesiones SET id_nodo_actual=NULL WHERE id_sesion=$1`,
          [e.sesion],
        );
        await q(
          `UPDATE chat.estado_sesiones SET estado_actual='PAUSADA',fecha_pausa=now() WHERE id_sesion=$1`,
          [e.sesion],
        );
        const antes = await snapshot(e.sesion);
        const comienzo = performance.now();
        const estado = await iniciar.execute(usuario);
        process.stdout.write(
          `RF32_RECUPERACION_MS ${Math.round(performance.now() - comienzo)}\n`,
        );
        assert.equal(estado.reanudada, true);
        assert.equal(estado.recuperada_desde_historial, true);
        assert.equal(estado.sesion.id_sesion, e.sesion);
        assert.equal(
          estado.nodo_actual.id_nodo,
          paso.transicion.id_nodo_destino,
        );
        assert.equal(estado.nodo_actual.es_terminal, false);
        assert.equal(estado.nodo_actual.contenido, undefined);
        assert.equal(estado.nodo_actual.bloques[0].texto, 'Siguiente paso');
        assert.equal(estado.sesion.estado_actual, 'ACTIVA');
        assert.equal(estado.sesion.version_arbol_utilizada, 1);
        assert.equal(estado.sesion.ultima_secuencia, 22);
        assert.equal(
          estado.sesion.fecha_ultima_interaccion.toISOString(),
          antes.fecha_ultima_interaccion.toISOString(),
        );
        assert.deepEqual(
          estado.historial_reciente.items.map((item) => item.secuencia),
          Array.from({ length: 20 }, (_, i) => i + 3),
        );
        assert.equal(estado.historial_reciente.hay_mas, true);
        assert.equal(estado.historial_reciente.siguiente_cursor, 3);
        assert.equal(
          (await snapshot(e.sesion)).id_nodo_actual,
          estado.nodo_actual.id_nodo,
        );
        assert.equal(
          (await recuperar.recuperar(e.sesion, usuario))
            .recuperadaDesdeHistorial,
          false,
        );
        assert.deepEqual(await enviar(e), { ...primera, duplicada: true });
        const previo = await historial.consultar({
          idSesion: e.sesion,
          antesDe: 3,
          limite: 20,
        });
        assert.deepEqual(
          previo.interacciones.map((item) => item.secuencia),
          [1, 2],
        );
      },
    );
    await check(
      'RF-32 revierte la reparación y conserva la pausa si el historial está corrupto',
      async () => {
        const e = await crear();
        await enviar(e);
        await q(
          `INSERT INTO chat.interacciones(id_interaccion,id_sesion,id_nodo,secuencia) VALUES($1,$2,$3,3)`,
          [randomUUID(), e.sesion, e.destino],
        );
        await q(
          `UPDATE chat.sesiones SET id_nodo_actual=NULL WHERE id_sesion=$1`,
          [e.sesion],
        );
        await q(
          `UPDATE chat.estado_sesiones SET estado_actual='PAUSADA',fecha_pausa=now() WHERE id_sesion=$1`,
          [e.sesion],
        );
        await sinCambios(e, 'ESTADO_INCONSISTENTE', () =>
          recuperar.recuperar(e.sesion, usuario),
        );
      },
    );
    await check(
      'RF-32 conserva una sola sesión ante creaciones concurrentes y detecta ERROR_CONFIGURACION',
      async () => {
        const e = await crear();
        await q(
          `UPDATE chat.flujo_conversacion SET estado='PUBLICADO',fecha_publicacion=now() WHERE id_flujo=$1`,
          [e.flujo],
        );
        await q(`UPDATE chat.nodos SET es_nodo_inicial=true WHERE id_nodo=$1`, [
          e.nodo,
        ]);
        const inicioGrupal = casoInicio(() =>
          Promise.resolve({ modalidad: 'GRUPAL', perfil: null }),
        );
        const resultados = await Promise.all([
          inicioGrupal.execute(otroUsuario),
          inicioGrupal.execute(otroUsuario),
        ]);
        assert.equal(resultados.filter((r) => !r.reanudada).length, 1);
        assert.equal(
          resultados[0].sesion.id_sesion,
          resultados[1].sesion.id_sesion,
        );
        for (const resultado of resultados) {
          assert.equal(resultado.nodo_actual.id_nodo, e.nodo);
          assert.equal(resultado.sesion.ultima_secuencia, 0);
          assert.deepEqual(resultado.historial_reciente, {
            items: [],
            hay_mas: false,
            siguiente_cursor: null,
          });
        }
        const candidata = () =>
          SesionConversacional.iniciar(
            {
              idSesion: randomUUID(),
              idUsuario: otroUsuario,
              idFlujoConversacional: e.flujo,
              versionArbolUtilizada: 1,
              modalidadActiva: 'GRUPAL',
              tipoDependencia: null,
              tipoCraving: null,
              idNodoInicial: e.nodo,
            },
            new Date(),
          );
        const existente = await sesiones.buscarUltimaNoCompletada(otroUsuario);
        assert.equal(
          (await recuperar.recuperar(existente.idSesion, otroUsuario)).sesion
            .idSesion,
          existente.idSesion,
        );
        await q(
          `UPDATE chat.estado_sesiones SET estado_actual='ERROR_CONFIGURACION' WHERE id_sesion=$1`,
          [existente.idSesion],
        );
        assert.equal(
          (await sesiones.buscarUltimaNoCompletada(otroUsuario)).idSesion,
          existente.idSesion,
        );
        await rechaza(
          inicioGrupal.execute(otroUsuario),
          'SESION_ERROR_CONFIGURACION',
        );
        await rechaza(sesiones.guardar(candidata()), 'SESION_ACTIVA_EXISTENTE');
        assert.equal(
          (
            await q(
              'SELECT count(*)::int AS cantidad FROM chat.sesiones WHERE id_usuario=$1',
              [otroUsuario],
            )
          ).rows[0].cantidad,
          1,
        );
      },
    );
    await check(
      'RF-31 reconoce una sesión vacía y rechaza una inexistente',
      async () => {
        const e = await crear();
        assert.equal(await historialValido(e.sesion), true);
        assert.equal(await historialValido(randomUUID()), false);
        assert.deepEqual(
          await historial.consultar({
            idSesion: e.sesion,
            antesDe: null,
            limite: 20,
          }),
          {
            hayMas: false,
            interacciones: [],
          },
        );
      },
    );
    await check(
      'RF-31 rechaza huecos de secuencia y revierte el siguiente paso',
      async () => {
        const e = await crear();
        await q(
          `INSERT INTO chat.interacciones(id_interaccion,id_sesion,id_nodo,secuencia) VALUES($1,$2,$3,2)`,
          [randomUUID(), e.sesion, e.nodo],
        );
        assert.equal(await historialValido(e.sesion), false);
        assert.equal(
          await historial.consultar({
            idSesion: e.sesion,
            antesDe: null,
            limite: 20,
          }),
          null,
        );
        e.dto.secuencia = 3;
        await sinCambios(e, 'HISTORIAL_INCONSISTENTE');
      },
    );
    await check(
      'RF-31 detecta un nodo ajeno al flujo fijado aunque la secuencia sea válida',
      async () => {
        const e = await crear();
        const ajeno = await crear();
        await q(
          `INSERT INTO chat.historial_nodos(id_sesion,id_nodo,id_usuario,id_nodo_destino) VALUES($1,$2,$3,$4)`,
          [e.sesion, e.nodo, usuario, ajeno.destino],
        );
        await q(
          `UPDATE chat.sesiones SET id_nodo_actual=$1 WHERE id_sesion=$2`,
          [ajeno.destino, e.sesion],
        );
        assert.equal(await historialValido(e.sesion), false);
      },
    );
    await check(
      'RF-31 detecta un historial desencadenado aun con nodos del mismo flujo',
      async () => {
        const e = await crear();
        await enviar(e);
        const id = randomUUID();
        await q(
          `INSERT INTO chat.interacciones(id_interaccion,id_sesion,id_nodo,secuencia) VALUES($1,$2,$3,2)`,
          [id, e.sesion, e.nodo],
        );
        await q(
          `INSERT INTO chat.historial_nodos(id_sesion,id_nodo,id_usuario,id_nodo_destino,id_interaccion) VALUES($1,$2,$3,$4,$5)`,
          [e.sesion, e.nodo, usuario, e.destino, id],
        );
        assert.equal(await historialValido(e.sesion), false);
      },
    );
    await check(
      'RF-31 detecta desajustes del puntero y de la versión fijada',
      async () => {
        const e = await crear();
        await enviar(e);
        await q(
          `UPDATE chat.sesiones SET id_nodo_actual=$1 WHERE id_sesion=$2`,
          [e.nodo, e.sesion],
        );
        assert.equal(await historialValido(e.sesion), false);
        await q(
          `UPDATE chat.sesiones SET id_nodo_actual=$1, version_arbol_utilizada=2 WHERE id_sesion=$2`,
          [e.destino, e.sesion],
        );
        assert.equal(await historialValido(e.sesion), false);
      },
    );
    await check(
      'RF-31 puede continuar y completar una sesión con historia previa sin vínculo',
      async () => {
        const e = await crear();
        const idAnterior = randomUUID();
        const fechaAnterior = '2026-11-06T10:00:00.123456-05:00';
        await q(
          `INSERT INTO chat.interacciones(id_interaccion,id_sesion,id_nodo,secuencia,timestamp_interaccion) VALUES($1,$2,$3,1,$4)`,
          [idAnterior, e.sesion, e.nodo, fechaAnterior],
        );
        await q(
          `INSERT INTO chat.historial_nodos(id_sesion,id_nodo,id_usuario,id_nodo_destino,timestamp_interaccion) VALUES($1,$2,$3,$4,$5)`,
          [e.sesion, e.nodo, usuario, e.destino, fechaAnterior],
        );
        await q(
          `INSERT INTO chat.respuestas(id_interaccion,id_nodo,id_tipo_entrada,id_estado_conectividad,valor_respuesta)
          SELECT $1,$2,t.id_tipo_entrada,c.id_estado_conectividad,'5'::jsonb
          FROM chat.tipo_entrada t CROSS JOIN chat.estado_conectividad c
          WHERE t.nombre='NUMERICO' AND c.nombre='ONLINE'`,
          [idAnterior, e.nodo],
        );
        await q(
          `UPDATE chat.sesiones SET id_nodo_actual=$1 WHERE id_sesion=$2`,
          [e.destino, e.sesion],
        );
        assert.equal(await historialValido(e.sesion), true);
        const r = await caso.execute(e.sesion, usuario, {
          ...e.dto,
          id_nodo: e.destino,
          tipo_entrada: 'CONTINUAR',
          valor: null,
          secuencia: 2,
        });
        assert.equal(r.estado_sesion, 'COMPLETADA');
        assert.equal(await historialValido(e.sesion), true);
        const pagina = await historial.consultar({
          idSesion: e.sesion,
          antesDe: 2,
          limite: 20,
        });
        assert.deepEqual(
          pagina.interacciones.map(({ idInteraccion, idNodoDestino }) => [
            idInteraccion,
            idNodoDestino,
          ]),
          [[idAnterior, e.destino]],
        );
      },
    );
    await check(
      'RF-31 revierte todo si el UPDATE condicionado afecta cero filas',
      async () => {
        const e = await crear();
        await q(`CREATE FUNCTION chat.rf31_cambiar_puntero() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          UPDATE chat.sesiones SET id_nodo_actual=NEW.id_nodo_destino WHERE id_sesion=NEW.id_sesion;
          RETURN NEW;
        END;
      $$;
      CREATE TRIGGER rf31_cambiar_puntero AFTER INSERT ON chat.historial_nodos
        FOR EACH ROW EXECUTE FUNCTION chat.rf31_cambiar_puntero();`);
        try {
          await sinCambios(e, 'NODO_DESACTUALIZADO');
        } finally {
          await q(
            'DROP TRIGGER rf31_cambiar_puntero ON chat.historial_nodos; DROP FUNCTION chat.rf31_cambiar_puntero()',
          );
        }
      },
    );
    await check(
      'numérico válido persiste respuesta, interacción, historial y puntero',
      async () => {
        const e = await crear({ valor: 0 });
        const r = await enviar(e);
        assert.equal(r.transicion.id_nodo_destino, e.destino);
        assert.equal(r.id_interaccion, e.dto.id_interaccion);
        assert.equal(r.estado_sesion, 'ACTIVA');
        assert.equal((await snapshot(e.sesion)).id_nodo_actual, e.destino);
        const registro = await prisma.respuestas.findFirst({
          where: { id_interaccion: r.id_interaccion },
        });
        assert.equal(registro.valor_respuesta, 0);
        assert.equal(registro.es_valida, true);
        assert.equal(registro.id_tipo_respuesta, null);
        assert.equal(r.nodo_siguiente, undefined);
        const nodoDestino = await prisma.nodos.findUnique({
          where: { id_nodo: e.destino },
        });
        assert.deepEqual(nodoDestino.contenido.multimedia, [
          { url: 'https://example.test/recurso.png' },
        ]);
      },
    );
    for (const respuesta of [-1, 11, null, '5', {}, [5]]) {
      await check(
        `respuesta inválida ${JSON.stringify(respuesta)} no escribe nada`,
        async () => {
          const e = await crear({ valor: respuesta });
          await sinCambios(
            e,
            respuesta === null
              ? 'RESPUESTA_OBLIGATORIA'
              : typeof respuesta === 'number'
                ? 'FUERA_DE_RANGO'
                : 'TIPO_DATO_INVALIDO',
          );
        },
      );
    }
    await check(
      'sesión inexistente se rechaza sin crear interacciones',
      async () => {
        const e = await crear();
        const antes = await snapshot(e.sesion);
        await rechaza(
          caso.execute(randomUUID(), usuario, e.dto),
          'SESION_NO_ENCONTRADA',
        );
        assert.deepEqual(await snapshot(e.sesion), antes);
      },
    );
    for (const tabla of ['tipo_entrada', 'estado_conectividad']) {
      await check(
        `catálogo ${tabla} no configurado no deja escrituras parciales`,
        async () => {
          const e = await crear();
          const nombres =
            tabla === 'tipo_entrada' ? ['NUMERICO'] : ['ONLINE', 'EN_LINEA'];
          await q(
            `UPDATE chat.${tabla} SET nombre=nombre || '_LOCAL' WHERE nombre=ANY($1)`,
            [nombres],
          );
          try {
            await sinCambios(e, undefined);
          } finally {
            await q(
              `UPDATE chat.${tabla} SET nombre=left(nombre,length(nombre)-6) WHERE nombre=ANY($1)`,
              [nombres.map((n) => n + '_LOCAL')],
            );
          }
        },
      );
    }
    await check('sesión ajena no expone ni cambia el estado', async () => {
      const e = await crear();
      await sinCambios(e, 'SESION_NO_ENCONTRADA', () =>
        caso.execute(e.sesion, otroUsuario, e.dto),
      );
    });
    for (const estado of ['PAUSADA', 'COMPLETADA', 'ERROR_CONFIGURACION']) {
      await check(`sesión ${estado} no acepta respuestas`, async () =>
        sinCambios(await crear({ estado }), 'SESION_NO_ACTIVA'),
      );
    }
    await check('nodo desfasado rechazado', async () => {
      const e = await crear();
      e.dto.id_nodo = e.destino;
      await sinCambios(e, 'NODO_DESACTUALIZADO');
    });
    await check(
      'destino de otro flujo no produce escritura parcial',
      async () =>
        sinCambios(await crear({ destinoAjeno: true }), 'DESTINO_INVALIDO'),
    );
    await check(
      'nodo sin transiciones rechaza NODO_TERMINAL sin completar',
      async () => sinCambios(await crear({ regla: false }), 'NODO_TERMINAL'),
    );
    await check('respuesta válida sin coincidencia no avanza', async () =>
      sinCambios(
        await crear({ condicion: { valor: 9 }, operador: 'IGUALDAD' }),
        'SIN_COINCIDENCIA',
      ),
    );
    await check(
      'dos envíos concurrentes solo avanzan y guardan una vez',
      async () => {
        const e = await crear();
        const antes = await snapshot(e.sesion);
        const resultados = await Promise.allSettled([
          enviar(e),
          caso.execute(e.sesion, usuario, {
            ...e.dto,
            id_interaccion: randomUUID(),
          }),
        ]);
        assert.equal(
          resultados.filter((r) => r.status === 'fulfilled').length,
          1,
        );
        const rechazo = resultados.find((r) => r.status === 'rejected').reason;
        assert.equal(
          codigo(rechazo),
          'SECUENCIA_FUERA_DE_ORDEN',
          rechazo.cause?.message,
        );
        assert.equal(
          (await snapshot(e.sesion)).respuestas,
          antes.respuestas + 1,
        );
      },
    );
    await check(
      'reintento con el mismo UUID no duplica interacción',
      async () => {
        const e = await crear();
        const original = await enviar(e);
        const antes = await snapshot(e.sesion);
        const nuevaInstancia = new ProcesarRespuestaUseCase(
          new PrismaProcesarRespuestaRepository(prisma),
          new FormatoRespuestaAdapter(),
          new EstadoConversacionalService(),
        );
        assert.deepEqual(
          await nuevaInstancia.execute(e.sesion, usuario, e.dto),
          { ...original, duplicada: true },
        );
        assert.deepEqual(await snapshot(e.sesion), antes);
      },
    );
    await check('null opcional se almacena como JSON null', async () => {
      const e = await crear({
        obligatorio: false,
        valor: null,
        condicion: { valor: null },
        operador: 'IGUALDAD',
      });
      const r = await enviar(e);
      assert.equal(
        (
          await q(
            `SELECT valor_respuesta = 'null'::jsonb AS correcto FROM chat.respuestas WHERE id_interaccion=$1`,
            [r.id_interaccion],
          )
        ).rows[0].correcto,
        true,
      );
    });
    for (const datos of [
      { tipo: 'ESCALA', valor: 4 },
      {
        tipo: 'SELECCION_UNICA',
        tipoDato: 'SELECCION',
        permitido: ['a', 'b'],
        valor: 'a',
        condicion: { valor: 'a' },
        operador: 'IGUALDAD',
      },
      {
        tipo: 'SELECCION_MULTIPLE',
        tipoDato: 'SELECCION',
        permitido: ['a', 'b'],
        valor: ['b', 'a'],
        condicion: { valor: ['a', 'b'] },
        operador: 'IGUALDAD',
      },
      {
        tipo: 'BOOLEANO',
        tipoDato: 'SELECCION',
        permitido: ['true', 'false'],
        valor: false,
        condicion: { valor: false },
        operador: 'IGUALDAD',
      },
      {
        tipo: 'FECHA_HORA',
        tipoDato: 'FECHA',
        valor: '2026-11-05',
        condicion: { valor: '2026-11-05' },
        operador: 'IGUALDAD',
      },
      {
        tipo: 'TEXTO_LIBRE',
        tipoDato: 'TEXTO',
        valor: 'ABC',
        regex: '^[A-Z]{3}$',
        condicion: { valor: 'ABC' },
        operador: 'IGUALDAD',
      },
    ]) {
      await check(`flujo real con ${datos.tipo}`, async () => {
        const e = await crear(datos);
        const r = await enviar(e);
        assert.deepEqual(
          (
            await prisma.respuestas.findFirst({
              where: { id_interaccion: r.id_interaccion },
            })
          ).valor_respuesta,
          datos.valor,
        );
      });
    }
    await check(
      'personalizada conserva árbol, versión y perfil de la sesión',
      async () => {
        const e = await crear({ personalizado: true });
        await enviar(e);
        const s = await snapshot(e.sesion);
        assert.equal(s.id_flujo_conversacional, e.flujo);
        assert.equal(s.version_arbol_utilizada, 1);
        assert.equal(s.tipo_dependencia, 'TOLERANCIA');
        assert.equal(s.tipo_craving, 'POSITIVO');
      },
    );
    await check(
      'llegar al destino terminal completa y conserva el último nodo',
      async () => {
        const e = await crear({ destinoTerminal: true });
        const r = await enviar(e);
        assert.equal(r.transicion.es_terminal, true);
        assert.equal(r.estado_sesion, 'COMPLETADA');
        const antes = await snapshot(e.sesion);
        assert.equal(antes.id_nodo_actual, e.destino);
        assert.ok(antes.fecha_completada);
        await rechaza(
          caso.execute(e.sesion, usuario, {
            ...e.dto,
            id_interaccion: randomUUID(),
            id_nodo: e.destino,
            tipo_entrada: 'CONTINUAR',
            valor: null,
          }),
          'SESION_NO_ACTIVA',
        );
        assert.deepEqual(await snapshot(e.sesion), antes);
      },
    );
    for (const tabla of ['respuestas', 'historial_nodos', 'estado_sesiones']) {
      await check(
        `fallo en ${tabla} revierte todas las escrituras`,
        async () => {
          const e = await crear();
          await q(
            `CREATE FUNCTION chat.rf27_fallar() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fallo de prueba'; END $$`,
          );
          await q(
            `CREATE TRIGGER rf27_fallo BEFORE INSERT OR UPDATE ON chat.${tabla} FOR EACH ROW EXECUTE FUNCTION chat.rf27_fallar()`,
          );
          try {
            await sinCambios(e, undefined);
          } finally {
            await q(`DROP TRIGGER rf27_fallo ON chat.${tabla}`);
            await q(`DROP FUNCTION chat.rf27_fallar()`);
          }
        },
      );
    }
    await check(
      'FK impide respuestas con tipo de entrada inexistente',
      async () => {
        const e = await crear();
        const r = await enviar(e);
        await assert.rejects(
          q(
            `UPDATE chat.respuestas SET id_tipo_entrada=$1 WHERE id_interaccion=$2`,
            [randomUUID(), r.id_interaccion],
          ),
          (err) => err.code === '23503',
        );
      },
    );
    const etapa3 = readFileSync(
      resolve(
        __dirname,
        '../../../prisma/migrations/20261115110915_fix_etapa3_chat/migration.sql',
      ),
      'utf8',
    );
    const inicioInmutabilidad = etapa3.indexOf(
      'CREATE OR REPLACE FUNCTION chat.fn_bloquear_modificacion()',
    );
    const finInmutabilidad = etapa3.indexOf(
      'DROP TRIGGER IF EXISTS trg_eventos_sincronizacion_inmutables',
    );
    assert.ok(
      inicioInmutabilidad >= 0 && finInmutabilidad > inicioInmutabilidad,
    );
    await q(etapa3.slice(inicioInmutabilidad, finInmutabilidad));

    await check(
      'la migración impide actualizar o borrar interacciones',
      async () => {
        const e = await crear();
        await enviar(e);
        for (const accion of [
          'UPDATE chat.interacciones SET fecha_creacion=now() WHERE id_interaccion=$1',
          'DELETE FROM chat.interacciones WHERE id_interaccion=$1',
        ]) {
          await assert.rejects(q(accion, [e.dto.id_interaccion]), {
            code: '42501',
          });
        }
      },
    );

    await check(
      'registra interacción, respuesta e historial antes de mover el puntero',
      async () => {
        const e = await crear();
        await q(`
        CREATE FUNCTION chat.rf30_verificar_registro() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF NEW.id_nodo_actual IS DISTINCT FROM OLD.id_nodo_actual
            AND NOT EXISTS (
              SELECT 1 FROM chat.interacciones i
              JOIN chat.respuestas r USING (id_interaccion)
              JOIN chat.historial_nodos h USING (id_interaccion)
              WHERE i.id_sesion=OLD.id_sesion AND i.id_nodo=OLD.id_nodo_actual
                AND h.id_nodo_destino=NEW.id_nodo_actual
            )
          THEN RAISE EXCEPTION 'El nodo se movió antes de registrar la interacción';
          END IF;
          RETURN NEW;
        END $$;
        CREATE TRIGGER rf30_verificar_registro BEFORE UPDATE ON chat.sesiones
          FOR EACH ROW EXECUTE FUNCTION chat.rf30_verificar_registro();
      `);
        try {
          const resultado = await enviar(e);
          assert.equal(resultado.duplicada, false);
          assert.equal((await snapshot(e.sesion)).id_nodo_actual, e.destino);
        } finally {
          await q(
            'DROP TRIGGER rf30_verificar_registro ON chat.sesiones; DROP FUNCTION chat.rf30_verificar_registro()',
          );
        }
      },
    );

    await check(
      'conserva conectividad, marca temporal y recursos de la captura sin conexión',
      async () => {
        const e = await crear();
        e.dto.estado_conectividad = 'SIN_CONEXION';
        e.dto.timestamp_interaccion = '2026-11-13T19:40:12.481234-05:00';
        e.dto.recursos_no_presentados = [randomUUID(), randomUUID()];
        const resultado = await enviar(e);
        const {
          rows: [fila],
        } = await q(
          `
        SELECT i.fecha_creacion, i.secuencia, i.recursos_no_presentados, c.nombre,
          to_char(i.timestamp_interaccion AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS.US') AS capturada,
          r.id_respuesta
        FROM chat.interacciones i JOIN chat.respuestas r USING (id_interaccion)
        JOIN chat.estado_conectividad c USING (id_estado_conectividad)
        WHERE i.id_interaccion=$1
      `,
          [e.dto.id_interaccion],
        );
        assert.equal(resultado.id_interaccion, e.dto.id_interaccion);
        assert.notEqual(fila.id_respuesta, e.dto.id_interaccion);
        assert.equal(
          fila.fecha_creacion.toISOString(),
          resultado.registrada_en,
        );
        assert.equal(fila.secuencia, 1);
        assert.equal(fila.nombre, 'SIN_CONEXION');
        assert.equal(fila.capturada, '2026-11-14 00:40:12.481234');
        assert.deepEqual(
          fila.recursos_no_presentados,
          e.dto.recursos_no_presentados,
        );
      },
    );

    await check(
      'ordena por secuencia aunque los relojes de captura retrocedan',
      async () => {
        const e = await crear();
        const a = await enviar(e);
        const b = {
          ...e.dto,
          id_interaccion: randomUUID(),
          id_nodo: e.destino,
          tipo_entrada: 'CONTINUAR',
          valor: null,
          timestamp_interaccion: '2026-11-06T11:48:00-05:00',
        };
        await sinCambios(e, 'SECUENCIA_FUERA_DE_ORDEN', () =>
          caso.execute(e.sesion, usuario, { ...b, secuencia: 3 }),
        );
        const siguiente = await caso.execute(e.sesion, usuario, {
          ...b,
          secuencia: 2,
        });
        assert.equal(siguiente.secuencia, 2);
        const ultima = await historial.consultar({
          idSesion: e.sesion,
          antesDe: null,
          limite: 1,
        });
        assert.equal(ultima.hayMas, true);
        assert.equal(
          ultima.interacciones[0].idInteraccion,
          siguiente.id_interaccion,
        );
        assert.equal(
          ultima.interacciones[0].idNodoDestino,
          siguiente.transicion.id_nodo_destino,
        );
        const anterior = await historial.consultar({
          idSesion: e.sesion,
          antesDe: 2,
          limite: 1,
        });
        assert.equal(anterior.hayMas, false);
        assert.equal(anterior.interacciones[0].idInteraccion, a.id_interaccion);
        assert.equal(anterior.interacciones[0].idNodoDestino, e.destino);
        const { rows } = await q(
          'SELECT secuencia, timestamp_interaccion, recursos_no_presentados FROM chat.interacciones WHERE id_sesion=$1 ORDER BY secuencia',
          [e.sesion],
        );
        assert.deepEqual(
          rows.map((fila) => fila.secuencia),
          [1, 2],
        );
        assert.ok(
          rows[0].timestamp_interaccion > rows[1].timestamp_interaccion,
        );
        assert.equal(rows[0].recursos_no_presentados, null);
        assert.deepEqual(await enviar(e), { ...a, duplicada: true });
      },
    );

    await check(
      'un UUID reutilizado con otro contenido no modifica registros',
      async () => {
        const e = await crear();
        await enviar(e);
        await sinCambios(e, 'ID_INTERACCION_REUTILIZADA', () =>
          caso.execute(e.sesion, usuario, { ...e.dto, valor: 6 }),
        );
      },
    );
    await check(
      'reenvíos concurrentes del mismo id_interaccion devuelven el resultado original',
      async () => {
        const e = await crear(),
          antes = await snapshot(e.sesion);
        const resultados = await Promise.all([enviar(e), enviar(e)]);
        assert.deepEqual(resultados.map((r) => r.duplicada).sort(), [
          false,
          true,
        ]);
        assert.deepEqual(
          { ...resultados[0], duplicada: true },
          { ...resultados[1], duplicada: true },
        );
        assert.equal(
          (await snapshot(e.sesion)).respuestas,
          antes.respuestas + 1,
        );
        assert.equal((await snapshot(e.sesion)).historial, antes.historial + 1);
      },
    );
    await check(
      'un reenvío conserva el resultado original después de otros avances y completar',
      async () => {
        const e = await crear(),
          original = await enviar(e);
        await caso.execute(e.sesion, usuario, {
          ...e.dto,
          id_interaccion: randomUUID(),
          id_nodo: e.destino,
          secuencia: 2,
          tipo_entrada: 'CONTINUAR',
          valor: null,
        });
        const antes = await snapshot(e.sesion);
        assert.equal(antes.estado_actual, 'COMPLETADA');
        assert.deepEqual(await enviar(e), { ...original, duplicada: true });
        assert.equal(original.estado_sesion, 'ACTIVA');
        assert.deepEqual(await snapshot(e.sesion), antes);
      },
    );
    await check(
      'colisión de id_interaccion entre sesiones no expone el resultado ni duplica',
      async () => {
        const a = await crear(),
          b = await crear();
        b.dto.id_interaccion = a.dto.id_interaccion;
        const antes = await snapshot(a.sesion);
        const resultados = await Promise.allSettled([enviar(a), enviar(b)]);
        assert.equal(
          resultados.filter((r) => r.status === 'fulfilled').length,
          1,
        );
        assert.equal(
          codigo(resultados.find((r) => r.status === 'rejected').reason),
          'ID_INTERACCION_REUTILIZADA',
        );
        assert.equal(
          (await snapshot(a.sesion)).respuestas,
          antes.respuestas + 1,
        );
      },
    );
    await check(
      'un reenvío de una sesión ajena mantiene 404 aunque exista resultado',
      async () => {
        const e = await crear();
        await enviar(e);
        const antes = await snapshot(e.sesion);
        await rechaza(
          caso.execute(e.sesion, otroUsuario, e.dto),
          'SESION_NO_ENCONTRADA',
        );
        assert.deepEqual(await snapshot(e.sesion), antes);
      },
    );
    await check(
      'texto libre válido puede continuar por una coincidencia explícita',
      async () => {
        const e = await crear({
          tipo: 'TEXTO_LIBRE',
          tipoDato: 'TEXTO',
          valor: 'Texto que no existía antes',
          regex: '^.{3,}$',
          operador: 'IGUALDAD',
          condicion: { valor: 'Texto que no existía antes' },
        });
        assert.equal((await enviar(e)).transicion.id_nodo_destino, e.destino);
      },
    );
    await check(
      'CONTINUAR guarda JSON null y selecciona una sola transición',
      async () => {
        const e = await crear({
          tipo: 'CONTINUAR',
          tipoDato: 'TEXTO',
          obligatorio: false,
          valor: null,
          operador: 'IGUALDAD',
          condicion: { valor: null },
        });
        const r = await enviar(e);
        assert.equal(
          (
            await prisma.respuestas.findFirst({
              where: { id_interaccion: r.id_interaccion },
            })
          ).valor_respuesta,
          null,
        );
        assert.equal(r.transicion.id_nodo_destino, e.destino);
      },
    );
    const clinica = (dimension, valor, personalizado = false) =>
      crear({
        tipo: 'OPCION_UNICA',
        tipoDato: 'SELECCION',
        valor,
        permitido:
          dimension === 'tipo_dependencia'
            ? ['TOLERANCIA', 'ABSTINENCIA_FISICA']
            : ['POSITIVO', 'NEGATIVO'],
        operador: 'IGUALDAD',
        condicion: { valor },
        captura: dimension,
        personalizado,
      });
    const perfil = async () =>
      (
        await q('SELECT * FROM chat.perfil_clinico WHERE id_usuario=$1', [
          usuario,
        ])
      ).rows[0];
    await check(
      'captura dependencia sin inventar craving ni marcar el perfil completo',
      async () => {
        const e = await clinica('tipo_dependencia', 'TOLERANCIA');
        const inicio = Date.now();
        await enviar(e);
        const p = await perfil();
        assert.equal(p.tipo_dependencia, 'TOLERANCIA');
        assert.equal(p.tipo_craving, null);
        assert.equal(p.perfil_completo, false);
        assert.ok(p.fecha_captura_dependencia.getTime() >= inicio);
        assert.ok(p.fecha_captura_dependencia.getTime() <= Date.now());
        assert.equal(p.fecha_captura_craving, null);
      },
    );
    await check(
      'captura craving conserva dependencia y PostgreSQL calcula perfil_completo',
      async () => {
        const antes = await perfil(),
          e = await clinica('tipo_craving', 'POSITIVO');
        await enviar(e);
        const p = await perfil();
        assert.equal(p.tipo_dependencia, 'TOLERANCIA');
        assert.equal(p.tipo_craving, 'POSITIVO');
        assert.equal(p.perfil_completo, true);
        assert.deepEqual(
          p.fecha_captura_dependencia,
          antes.fecha_captura_dependencia,
        );
      },
    );
    await check(
      'una captura posterior conserva el valor original, sus fechas y la otra dimensión',
      async () => {
        const antes = await perfil(),
          e = await clinica('tipo_dependencia', 'ABSTINENCIA_FISICA');
        e.dto.timestamp_interaccion = '2026-11-06T12:00:00-05:00';
        await enviar(e);
        const p = await perfil();
        assert.equal(p.tipo_dependencia, 'TOLERANCIA');
        assert.equal(p.tipo_craving, 'POSITIVO');
        assert.equal(p.perfil_completo, true);
        assert.deepEqual(p, antes);
        assert.equal((await snapshot(e.sesion)).id_nodo_actual, e.destino);
      },
    );
    await check(
      'valores clínicos inválidos no alteran perfil ni conversación',
      async () => {
        await sinCambios(
          await clinica('tipo_craving', 'OTRO'),
          'VALOR_NO_PERMITIDO',
        );
      },
    );
    await check(
      'valida el enum clínico aun si una regla del árbol permite un valor incorrecto',
      async () => {
        const e = await clinica('tipo_craving', 'OTRO');
        await q(
          "UPDATE chat.reglas_validaciones SET valores_permitidos=ARRAY['OTRO'] WHERE id_regla_validacion = (SELECT id_regla_validacion FROM chat.reglas_nodos WHERE id_nodo_origen=$1)",
          [e.nodo],
        );
        await q(
          `UPDATE chat.nodos SET contenido = jsonb_set(contenido, '{entrada,opciones}', '["OTRO"]') WHERE id_nodo=$1`,
          [e.nodo],
        );
        await sinCambios(e, 'VALOR_NO_PERMITIDO');
      },
    );
    await check(
      'captura en modalidad personalizada responde CAPTURA_FUERA_DE_GRUPAL',
      async () => {
        await sinCambios(
          await clinica('tipo_craving', 'NEGATIVO', true),
          'CAPTURA_FUERA_DE_GRUPAL',
        );
      },
    );
    await check(
      'una selección normal no actualiza el perfil por coincidencia de sus valores',
      async () => {
        const antes = await perfil();
        await enviar(
          await crear({
            tipo: 'OPCION_UNICA',
            tipoDato: 'SELECCION',
            valor: 'NEGATIVO',
            permitido: ['NEGATIVO'],
            operador: 'IGUALDAD',
            condicion: { valor: 'NEGATIVO' },
          }),
        );
        assert.deepEqual(await perfil(), antes);
      },
    );
    await check(
      'fallo del perfil responde ERROR_PERSISTENCIA y revierte toda la respuesta',
      async () => {
        const e = await clinica('tipo_craving', 'NEGATIVO');
        await q(
          `CREATE FUNCTION chat.rf27_fallar_perfil() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fallo local de perfil'; END $$`,
        );
        await q(
          'CREATE TRIGGER rf27_fallo_perfil BEFORE INSERT OR UPDATE ON chat.perfil_clinico FOR EACH ROW EXECUTE FUNCTION chat.rf27_fallar_perfil()',
        );
        try {
          await sinCambios(e, 'ERROR_PERSISTENCIA');
        } finally {
          await q('DROP TRIGGER rf27_fallo_perfil ON chat.perfil_clinico');
          await q('DROP FUNCTION chat.rf27_fallar_perfil()');
        }
      },
    );
    await check(
      'un fallo posterior a la captura también revierte el perfil generado',
      async () => {
        const e = await clinica('tipo_craving', 'NEGATIVO');
        await q('DELETE FROM chat.perfil_clinico WHERE id_usuario=$1', [
          usuario,
        ]);
        await q(
          `CREATE FUNCTION chat.rf27_fallar_historial() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fallo local posterior al perfil'; END $$`,
        );
        await q(
          'CREATE TRIGGER rf27_fallo_historial BEFORE INSERT ON chat.historial_nodos FOR EACH ROW EXECUTE FUNCTION chat.rf27_fallar_historial()',
        );
        try {
          await sinCambios(e, undefined);
        } finally {
          await q('DROP TRIGGER rf27_fallo_historial ON chat.historial_nodos');
          await q('DROP FUNCTION chat.rf27_fallar_historial()');
        }
      },
    );
    await check(
      'capturas concurrentes conservan ambas dimensiones y su completitud',
      async () => {
        await q('DELETE FROM chat.perfil_clinico WHERE id_usuario=$1', [
          usuario,
        ]);
        const a = await clinica('tipo_dependencia', 'TOLERANCIA'),
          b = await clinica('tipo_craving', 'NEGATIVO');
        await Promise.all([enviar(a), enviar(b)]);
        const p = await perfil();
        assert.equal(p.tipo_dependencia, 'TOLERANCIA');
        assert.equal(p.tipo_craving, 'NEGATIVO');
        assert.equal(p.perfil_completo, true);
      },
    );

    const capturar = (e, dimension, valor, modalidadSesion = 'GRUPAL') =>
      persistencia.ejecutar((tx) =>
        tx.perfil.capturarDimension({
          idUsuario: usuario,
          idSesion: e.sesion,
          idNodo: e.nodo,
          dimension,
          valor,
          modalidadSesion,
        }),
      );
    await check(
      'el puerto devuelve exactamente el contrato interno de primera captura',
      async () => {
        await q('DELETE FROM chat.perfil_clinico WHERE id_usuario=$1', [
          usuario,
        ]);
        const e = await clinica('tipo_dependencia', 'ABSTINENCIA_FISICA');
        const r = await capturar(e, 'TIPO_DEPENDENCIA', 'ABSTINENCIA_FISICA');
        assert.deepEqual(r, {
          aplicado: true,
          dimension: 'TIPO_DEPENDENCIA',
          valorVigente: 'ABSTINENCIA_FISICA',
          perfilCompleto: false,
        });
        assert.equal((await perfil()).tipo_craving, null);
      },
    );
    await check(
      'una dimensión existente devuelve aplicado false sin alterar el perfil',
      async () => {
        const antes = await perfil();
        const e = await clinica('tipo_dependencia', 'TOLERANCIA');
        const r = await capturar(e, 'TIPO_DEPENDENCIA', 'TOLERANCIA');
        assert.deepEqual(r, {
          aplicado: false,
          dimension: 'TIPO_DEPENDENCIA',
          valorVigente: 'ABSTINENCIA_FISICA',
          perfilCompleto: false,
        });
        assert.deepEqual(await perfil(), antes);
        const respuesta = await enviar(e);
        assert.equal(respuesta.transicion.id_nodo_destino, e.destino);
        assert.deepEqual(await perfil(), antes);
        assert.equal(Object.hasOwn(respuesta, 'perfilCompleto'), false);
      },
    );
    await check(
      'capturar la segunda dimensión devuelve perfilCompleto true',
      async () => {
        const antes = await perfil();
        const e = await clinica('tipo_craving', 'NEGATIVO');
        assert.deepEqual(await capturar(e, 'TIPO_CRAVING', 'NEGATIVO'), {
          aplicado: true,
          dimension: 'TIPO_CRAVING',
          valorVigente: 'NEGATIVO',
          perfilCompleto: true,
        });
        assert.deepEqual(
          (await perfil()).fecha_captura_dependencia,
          antes.fecha_captura_dependencia,
        );
      },
    );
    await check(
      'repetir el mismo valor devuelve aplicado false y conserva todas las fechas',
      async () => {
        const antes = await perfil();
        const e = await clinica('tipo_craving', 'NEGATIVO');
        const r = await capturar(e, 'TIPO_CRAVING', 'NEGATIVO');
        assert.equal(r.aplicado, false);
        assert.equal(r.perfilCompleto, true);
        assert.deepEqual(await perfil(), antes);
      },
    );
    await check(
      'dos capturas concurrentes de una dimensión conservan un único valor original',
      async () => {
        await q('DELETE FROM chat.perfil_clinico WHERE id_usuario=$1', [
          usuario,
        ]);
        const a = await clinica('tipo_dependencia', 'TOLERANCIA');
        const b = await clinica('tipo_dependencia', 'ABSTINENCIA_FISICA');
        const resultados = await Promise.all([
          capturar(a, 'TIPO_DEPENDENCIA', 'TOLERANCIA'),
          capturar(b, 'TIPO_DEPENDENCIA', 'ABSTINENCIA_FISICA'),
        ]);
        assert.equal(resultados.filter((r) => r.aplicado).length, 1);
        const p = await perfil();
        for (const r of resultados)
          assert.equal(r.valorVigente, p.tipo_dependencia);
        assert.equal(p.perfil_completo, false);
      },
    );
    await check(
      'dos respuestas concurrentes de sesiones distintas avanzan sin sobrescribir el perfil',
      async () => {
        await q('DELETE FROM chat.perfil_clinico WHERE id_usuario=$1', [
          usuario,
        ]);
        const a = await clinica('tipo_craving', 'POSITIVO');
        const b = await clinica('tipo_craving', 'NEGATIVO');
        const resultados = await Promise.all([enviar(a), enviar(b)]);
        assert.equal(resultados.length, 2);
        assert.equal((await snapshot(a.sesion)).id_nodo_actual, a.destino);
        assert.equal((await snapshot(b.sesion)).id_nodo_actual, b.destino);
        const antes = await perfil();
        await enviar(
          await clinica(
            'tipo_craving',
            antes.tipo_craving === 'POSITIVO' ? 'NEGATIVO' : 'POSITIVO',
          ),
        );
        assert.deepEqual(await perfil(), antes);
      },
    );
    await check(
      'el reenvío idempotente de captura no actualiza el perfil ni las fechas',
      async () => {
        const e = await clinica('tipo_dependencia', 'TOLERANCIA');
        const r = await enviar(e);
        const antes = await snapshot(e.sesion);
        assert.deepEqual(await enviar(e), { ...r, duplicada: true });
        assert.deepEqual(await snapshot(e.sesion), antes);
      },
    );
    await check(
      'una sesión ajena no permite capturar ni alterar el perfil de otro usuario',
      async () => {
        const e = await clinica('tipo_craving', 'POSITIVO');
        await sinCambios(e, 'SESION_NO_ENCONTRADA', () =>
          caso.execute(e.sesion, otroUsuario, e.dto),
        );
      },
    );
    await check(
      'los nodos con metadata anterior siguen funcionando y conservan el primer valor',
      async () => {
        const antes = await perfil();
        const e = await crear({
          tipo: 'OPCION_UNICA',
          tipoDato: 'SELECCION',
          permitido: ['NEGATIVO'],
          valor: 'NEGATIVO',
          operador: 'IGUALDAD',
          condicion: { valor: 'NEGATIVO' },
          captura: 'tipo_craving',
          capturaLegada: true,
        });
        await enviar(e);
        assert.deepEqual(await perfil(), antes);
      },
    );
    await check(
      'el puerto rechaza un valor de otra dimensión antes de tocar la base',
      async () => {
        const antes = await perfil();
        const e = await clinica('tipo_dependencia', 'TOLERANCIA');
        await rechaza(
          capturar(e, 'TIPO_DEPENDENCIA', 'POSITIVO'),
          'VALOR_NO_PERMITIDO',
        );
        assert.deepEqual(await perfil(), antes);
      },
    );
    await check(
      'el puerto también impide capturas en modalidad personalizada',
      async () => {
        const antes = await perfil();
        const e = await clinica('tipo_dependencia', 'TOLERANCIA');
        await rechaza(
          capturar(e, 'TIPO_DEPENDENCIA', 'TOLERANCIA', 'PERSONALIZADA'),
          'CAPTURA_FUERA_DE_GRUPAL',
        );
        assert.deepEqual(await perfil(), antes);
      },
    );
    process.stdout.write(
      `RF30_INTEGRACION_RESULTADO: ${passed} aprobadas, ${failed} fallidas\n`,
    );
    if (failed) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    await sql.end();
  }
})().catch((error) => {
  process.stderr.write(`${error.stack}\n`);
  process.exitCode = 1;
});
