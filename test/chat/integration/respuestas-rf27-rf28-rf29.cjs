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
const { FormatoRespuestaAdapter } = source(
  'infrastructure/validation/formato-respuesta.adapter.ts',
);
const prisma = new PrismaService();
const sql = new Client({ connectionString: connection });
const persistencia = new PrismaProcesarRespuestaRepository(prisma);
const caso = new ProcesarRespuestaUseCase(
  persistencia,
  new FormatoRespuestaAdapter(),
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
    entrada: { tipo_entrada: tipo },
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
  if (regla) {
    await q(
      `INSERT INTO chat.reglas_validaciones(id_regla_validacion,tipo_dato,obligatorio,valor_min,valor_max,formato_regex,valores_permitidos,mensaje_error)
      VALUES($1,$2,$3,$4,$5,$6,$7,'Respuesta fuera de lo permitido')`,
      [
        validacion,
        tipoDato,
        obligatorio,
        tipoDato === 'NUMERICO' ? 0 : null,
        tipoDato === 'NUMERICO' ? 10 : null,
        regex,
        permitido,
      ],
    );
    await q(
      `INSERT INTO chat.reglas_nodos(id_flujo,id_nodo_origen,id_nodo_destino,id_regla_validacion,operador_condicion,valor_condicion,orden_evaluacion)
      VALUES($1,$2,$3,$4,$5,$6,1)`,
      [flujo, nodo, destino, validacion, operador, condicion],
    );
  }
  if (!destinoTerminal) {
    const fin = randomUUID(),
      validacionContinuar = randomUUID();
    await q(
      `INSERT INTO chat.nodos(id_nodo,id_flujo,id_tipo_nodo,contenido,creado_por) VALUES($1,$2,$3,$4,$5)`,
      [fin, flujoDestino, tipoMensaje, { texto: 'Final' }, usuario],
    );
    await q(
      `INSERT INTO chat.reglas_validaciones(id_regla_validacion,tipo_dato,obligatorio,valores_permitidos,mensaje_error) VALUES($1,'TEXTO',false,ARRAY[]::text[],'Continuar')`,
      [validacionContinuar],
    );
    await q(
      `INSERT INTO chat.reglas_nodos(id_flujo,id_nodo_origen,id_nodo_destino,id_regla_validacion,operador_condicion,valor_condicion,orden_evaluacion) VALUES($1,$2,$3,$4,'IGUALDAD',$5,1)`,
      [flujoDestino, destino, fin, validacionContinuar, { valor: null }],
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
      idNodo: nodo,
      idRespuesta: randomUUID(),
      tipoEntrada:
        {
          SELECCION_UNICA: 'OPCION_UNICA',
          SELECCION_MULTIPLE: 'MULTISELECCION',
        }[tipo] ?? tipo,
      valor,
      capturadaEn: '2026-11-06T11:49:00-05:00',
      conectividad: 'EN_LINEA',
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
          `INSERT INTO chat.interacciones(id_interaccion,id_sesion,id_nodo) VALUES($1,$2,$3)`,
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
    await check(
      'numérico válido persiste respuesta, interacción, historial y puntero',
      async () => {
        const e = await crear({ valor: 0 });
        const r = await enviar(e);
        assert.equal(r.transicion.idNodoDestino, e.destino);
        assert.equal(r.idRespuesta, e.dto.idRespuesta);
        assert.equal(r.estadoSesion, 'ACTIVA');
        assert.equal((await snapshot(e.sesion)).id_nodo_actual, e.destino);
        const registro = await prisma.respuestas.findUnique({
          where: { id_respuesta: r.idRespuesta },
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
      e.dto.idNodo = e.destino;
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
        'SIN_TRANSICION',
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
            idRespuesta: randomUUID(),
          }),
        ]);
        assert.equal(
          resultados.filter((r) => r.status === 'fulfilled').length,
          1,
        );
        assert.equal(
          codigo(resultados.find((r) => r.status === 'rejected').reason),
          'NODO_DESACTUALIZADO',
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
        );
        assert.deepEqual(
          await nuevaInstancia.execute(e.sesion, usuario, e.dto),
          original,
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
            `SELECT valor_respuesta = 'null'::jsonb AS correcto FROM chat.respuestas WHERE id_respuesta=$1`,
            [r.idRespuesta],
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
        condicion: { valores: ['a'] },
        operador: 'CATEGORIA',
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
            await prisma.respuestas.findUnique({
              where: { id_respuesta: r.idRespuesta },
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
        assert.equal(r.transicion.esTerminal, true);
        assert.equal(r.estadoSesion, 'COMPLETADA');
        const antes = await snapshot(e.sesion);
        assert.equal(antes.id_nodo_actual, e.destino);
        assert.ok(antes.fecha_completada);
        await rechaza(
          caso.execute(e.sesion, usuario, {
            ...e.dto,
            idRespuesta: randomUUID(),
            idNodo: e.destino,
            tipoEntrada: 'CONTINUAR',
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
            `UPDATE chat.respuestas SET id_tipo_entrada=$1 WHERE id_respuesta=$2`,
            [randomUUID(), r.idRespuesta],
          ),
          (err) => err.code === '23503',
        );
      },
    );
    await check(
      'reenvíos concurrentes del mismo idRespuesta devuelven el resultado original',
      async () => {
        const e = await crear(),
          antes = await snapshot(e.sesion);
        const resultados = await Promise.all([enviar(e), enviar(e)]);
        assert.deepEqual(resultados[0], resultados[1]);
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
          idRespuesta: randomUUID(),
          idNodo: e.destino,
          tipoEntrada: 'CONTINUAR',
          valor: null,
        });
        const antes = await snapshot(e.sesion);
        assert.equal(antes.estado_actual, 'COMPLETADA');
        assert.deepEqual(await enviar(e), original);
        assert.equal(original.estadoSesion, 'ACTIVA');
        assert.deepEqual(await snapshot(e.sesion), antes);
      },
    );
    await check(
      'colisión de idRespuesta entre sesiones no expone el resultado ni duplica',
      async () => {
        const a = await crear(),
          b = await crear();
        b.dto.idRespuesta = a.dto.idRespuesta;
        const antes = await snapshot(a.sesion);
        const resultados = await Promise.allSettled([enviar(a), enviar(b)]);
        assert.equal(
          resultados.filter((r) => r.status === 'fulfilled').length,
          1,
        );
        assert.equal(
          codigo(resultados.find((r) => r.status === 'rejected').reason),
          'NODO_DESACTUALIZADO',
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
      'texto libre válido puede continuar por una condición explícita de validez',
      async () => {
        const e = await crear({
          tipo: 'TEXTO_LIBRE',
          tipoDato: 'TEXTO',
          valor: 'Texto que no existía antes',
          regex: '^.{3,}$',
          operador: 'IGUALDAD',
          condicion: { campo: 'es_valida', valor: true },
        });
        assert.equal((await enviar(e)).transicion.idNodoDestino, e.destino);
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
            await prisma.respuestas.findUnique({
              where: { id_respuesta: r.idRespuesta },
            })
          ).valor_respuesta,
          null,
        );
        assert.equal(r.transicion.idNodoDestino, e.destino);
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
        operador: 'CATEGORIA',
        condicion: {
          valores:
            dimension === 'tipo_dependencia'
              ? ['TOLERANCIA', 'ABSTINENCIA_FISICA']
              : ['POSITIVO', 'NEGATIVO'],
        },
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
        e.dto.capturadaEn = '2026-11-06T12:00:00-05:00';
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
          "UPDATE chat.reglas_validaciones SET valores_permitidos=ARRAY['OTRO'] WHERE id_regla_validacion IN (SELECT id_regla_validacion FROM chat.reglas_nodos WHERE id_nodo_origen=$1)",
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
      'fallo del perfil responde ERROR_PERFIL y revierte toda la respuesta',
      async () => {
        const e = await clinica('tipo_craving', 'NEGATIVO');
        await q(
          `CREATE FUNCTION chat.rf27_fallar_perfil() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fallo local de perfil'; END $$`,
        );
        await q(
          'CREATE TRIGGER rf27_fallo_perfil BEFORE INSERT OR UPDATE ON chat.perfil_clinico FOR EACH ROW EXECUTE FUNCTION chat.rf27_fallar_perfil()',
        );
        try {
          await sinCambios(e, 'ERROR_PERFIL');
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
        assert.equal(respuesta.transicion.idNodoDestino, e.destino);
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
        assert.deepEqual(await enviar(e), r);
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
      `RF27_INTEGRACION_RESULTADO: ${passed} aprobadas, ${failed} fallidas\n`,
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
