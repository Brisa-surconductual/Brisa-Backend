import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { ProcesarRespuestaDtoRequest } from '../../src/modules/chat/application/dto/procesar-respuesta.dto-request';
import { EstadoConversacionalService } from '../../src/modules/chat/application/services/estado-conversacional.service';
import { HabilitacionNodoService } from '../../src/modules/chat/application/services/habilitacion-nodo.service';
import { VariablesEtiquetadasService } from '../../src/modules/chat/application/services/variables-etiquetadas.service';
import { ProcesarRespuestaUseCase } from '../../src/modules/chat/application/use-cases/sesion/procesar-respuesta.use-case';
import { CambiarEstadoVariableTaxonomiaUseCase } from '../../src/modules/chat/application/use-cases/taxonomia/cambiar-estado-variable-taxonomia.use-case';
import { ConsultarTaxonomiaVariablesUseCase } from '../../src/modules/chat/application/use-cases/taxonomia/consultar-taxonomia-variables.use-case';
import { CrearVariableTaxonomiaUseCase } from '../../src/modules/chat/application/use-cases/taxonomia/crear-variable-taxonomia.use-case';
import { TipoEntradaRespuesta } from '../../src/modules/chat/domain/enums/tipo-entrada-respuesta.enum';
import { TipoValorVariable } from '../../src/modules/chat/domain/enums/tipo-valor-variable.enum';
import { HabilitacionContenidoChatRepository } from '../../src/modules/chat/domain/repositories/habilitacion-contenido-chat.repository';
import { PrismaProcesarRespuestaRepository } from '../../src/modules/chat/infrastructure/persistence/prisma-procesar-respuesta.repository';
import { PrismaTaxonomiaVariablesRepository } from '../../src/modules/chat/infrastructure/persistence/prisma-taxonomia-variables.repository';
import { PrismaVariablesEtiquetadasRepository } from '../../src/modules/chat/infrastructure/persistence/prisma-variables-etiquetadas.repository';
import { FormatoRespuestaAdapter } from '../../src/modules/chat/infrastructure/validation/formato-respuesta.adapter';

/**
 * RF-30B contra PostgreSQL real. Requiere una base local desechable con todas
 * las migraciones aplicadas: RF30B_TEST_DATABASE_URL=postgresql://...@127.0.0.1:<puerto>/brisa_rf30b_<x>
 */
const urlBd = process.env.RF30B_TEST_DATABASE_URL;
const conPostgres = urlBd ? describe : describe.skip;

jest.setTimeout(45_000);

conPostgres('RF-30B taxonomía y etiquetado (PostgreSQL)', () => {
  let prisma: PrismaService;
  let taxonomia: PrismaTaxonomiaVariablesRepository;
  let responder: ProcesarRespuestaUseCase;
  let consultarVariables: VariablesEtiquetadasService;

  beforeAll(async () => {
    const url = new URL(urlBd ?? '');
    if (
      url.hostname !== '127.0.0.1' ||
      !/^\/brisa_rf30b_[a-z0-9_]+$/.test(url.pathname)
    )
      throw new Error(
        'RF-30B requiere una base local desechable brisa_rf30b_*.',
      );
    const anterior = process.env.DATABASE_URL;
    process.env.DATABASE_URL = url.toString();
    try {
      prisma = new PrismaService();
    } finally {
      if (anterior === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = anterior;
    }
    await prisma.$connect();
    taxonomia = new PrismaTaxonomiaVariablesRepository(prisma);
    const sinCronograma = {
      consultar: jest.fn(),
    } as unknown as HabilitacionContenidoChatRepository;
    responder = new ProcesarRespuestaUseCase(
      new PrismaProcesarRespuestaRepository(prisma),
      new FormatoRespuestaAdapter(),
      new EstadoConversacionalService(),
      new HabilitacionNodoService(sinCronograma),
    );
    consultarVariables = new VariablesEtiquetadasService(
      new PrismaVariablesEtiquetadasRepository(prisma),
    );
  });

  afterAll(async () => prisma?.$disconnect());

  async function crearUsuario(): Promise<string> {
    const id = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO usuario.usuarios (id_usuario, correo_electronico, contrasena_hash)
      VALUES (${id}::uuid, ${`${id}@example.invalid`}, 'fixture-rf30b')
    `;
    return id;
  }

  /** Flujo de dos nodos; el inicial captura `variable` con la entrada dada. */
  async function crearSesion(opciones: {
    entrada: Record<string, unknown>;
    variable: string;
    publicado?: boolean;
  }) {
    const usuario = await crearUsuario();
    const [flujo, inicio, fin, sesion, regla] = [
      randomUUID(),
      randomUUID(),
      randomUUID(),
      randomUUID(),
      randomUUID(),
    ];
    const contenido = JSON.stringify({
      texto: 'Pregunta RF-30B',
      entrada: opciones.entrada,
      variable: { codigo: opciones.variable },
    });
    const [{ version }] = await prisma.$queryRaw<{ version: number }[]>`
      SELECT COALESCE(MAX(version), 0) + 1 AS version
      FROM chat.flujo_conversacion WHERE modalidad = 'PERSONALIZADA'
    `;
    await prisma.$transaction([
      prisma.$executeRaw`
        INSERT INTO chat.flujo_conversacion
          (id_flujo, nombre, modalidad, version, creado_por, tipo_dependencia, tipo_craving, estado)
        VALUES (${flujo}::uuid, 'RF30B local', 'PERSONALIZADA', ${version}, ${usuario}::uuid,
          'TOLERANCIA', 'NEGATIVO', 'BORRADOR')
      `,
      prisma.$executeRaw`
        INSERT INTO chat.tipo_nodo (nombre) VALUES ('PREGUNTA'), ('MENSAJE')
        ON CONFLICT (nombre) DO NOTHING
      `,
      prisma.$executeRaw`
        INSERT INTO chat.nodos (id_nodo, id_flujo, id_tipo_nodo, contenido, creado_por, es_nodo_inicial, orden)
        SELECT ${inicio}::uuid, ${flujo}::uuid, id_tipo_nodo, ${contenido}::jsonb, ${usuario}::uuid, true, 1
        FROM chat.tipo_nodo WHERE nombre = 'PREGUNTA'
        UNION ALL
        SELECT ${fin}::uuid, ${flujo}::uuid, id_tipo_nodo, '{"texto":"Fin"}'::jsonb, ${usuario}::uuid, false, 2
        FROM chat.tipo_nodo WHERE nombre = 'MENSAJE'
      `,
      prisma.$executeRaw`
        INSERT INTO chat.reglas_validaciones
          (id_regla_validacion, tipo_dato, obligatorio, mensaje_error, operador_condicion, valor_esperado)
        VALUES (${regla}::uuid, 'NUMERICO', false, 'Revisa tu respuesta', 'RANGO', '{"min":0,"max":10}')
      `,
      prisma.$executeRaw`
        INSERT INTO chat.reglas_nodos (id_flujo, id_nodo_origen, id_nodo_destino, id_regla_validacion, orden_evaluacion)
        VALUES (${flujo}::uuid, ${inicio}::uuid, ${fin}::uuid, ${regla}::uuid, 1)
      `,
      prisma.$executeRaw`
        INSERT INTO chat.sesiones (id_sesion, id_usuario, id_flujo_conversacional, version_arbol_utilizada,
          modalidad_activa, id_nodo_actual, tipo_dependencia, tipo_craving)
        VALUES (${sesion}::uuid, ${usuario}::uuid, ${flujo}::uuid, ${version}, 'PERSONALIZADA',
          ${inicio}::uuid, 'TOLERANCIA', 'NEGATIVO')
      `,
      prisma.$executeRaw`
        INSERT INTO chat.estado_sesiones (id_sesion, estado_actual) VALUES (${sesion}::uuid, 'ACTIVA')
      `,
    ]);
    if (opciones.publicado)
      await prisma.$executeRaw`
        UPDATE chat.flujo_conversacion SET estado = 'PUBLICADO', fecha_publicacion = now()
        WHERE id_flujo = ${flujo}::uuid
      `;
    return { usuario, sesion, inicio };
  }

  const respuesta = (
    idNodo: string,
    valor: unknown,
    tipo = 'NUMERICO',
  ): ProcesarRespuestaDtoRequest => ({
    id_interaccion: randomUUID(),
    id_nodo: idNodo,
    secuencia: 1,
    tipo_entrada: tipo,
    valor,
    timestamp_interaccion: '2026-11-22T19:40:12-05:00',
    estado_conectividad: 'EN_LINEA',
  });

  it('la migración carga el seed 1.0', async () => {
    const consulta = await new ConsultarTaxonomiaVariablesUseCase(
      taxonomia,
    ).execute(true);
    expect(consulta.variables.map((v) => v.codigo)).toEqual(
      expect.arrayContaining([
        'NIVEL_CRAVING',
        'FRECUENCIA_VAPEO',
        'CONTEXTO_EMOCIONAL',
        'SITUACION_RIESGO',
      ]),
    );
  });

  it('etiqueta en la transacción del POST con snapshot del perfil y es inmutable', async () => {
    const { usuario, sesion, inicio } = await crearSesion({
      entrada: { tipo: 'NUMERICO', min: 0, max: 10 },
      variable: 'NIVEL_CRAVING',
    });
    await prisma.$executeRaw`
      INSERT INTO chat.perfil_clinico (id_usuario, tipo_dependencia) VALUES (${usuario}::uuid, 'TOLERANCIA')
    `;
    const dto = respuesta(inicio, 7);

    await responder.execute(sesion, usuario, dto);

    const filas = await prisma.$queryRaw<
      {
        codigo_variable: string;
        elementos: unknown;
        tipo_dependencia: string | null;
        estado_etiquetado: string;
        version_taxonomia: string;
      }[]
    >`
      SELECT codigo_variable, elementos, tipo_dependencia::text AS tipo_dependencia,
        estado_etiquetado::text AS estado_etiquetado, version_taxonomia
      FROM chat.variables_etiquetadas WHERE id_interaccion = ${dto.id_interaccion}::uuid
    `;
    expect(filas).toEqual([
      expect.objectContaining({
        codigo_variable: 'NIVEL_CRAVING',
        elementos: [{ valor: 7, etiqueta: 'CRAVING_ALTO' }],
        tipo_dependencia: 'TOLERANCIA',
        estado_etiquetado: 'PENDIENTE_PERFIL',
      }),
    ]);
    await expect(
      prisma.$executeRaw`UPDATE chat.variables_etiquetadas SET codigo_variable = 'X' WHERE id_sesion = ${sesion}::uuid`,
    ).rejects.toThrow(/inmutables/);

    const payload = await consultarVariables.listarPorSesion(sesion);
    expect(payload).toMatchObject({
      id_usuario: usuario,
      id_sesion: sesion,
      id_interaccion: dto.id_interaccion,
      modalidad_intervencion: 'PERSONALIZADA',
      perfil_clinico: {
        tipo_dependencia: 'TOLERANCIA',
        tipo_craving: 'PENDIENTE_PERFIL',
      },
      variables_sesion: [
        { codigo: 'NIVEL_CRAVING', valor: 7, etiqueta: 'CRAVING_ALTO' },
      ],
      estado_etiquetado: 'PENDIENTE_PERFIL',
    });
  });

  it('un valor fuera de la variable revierte todo: ni interacción ni etiqueta', async () => {
    const { usuario, sesion, inicio } = await crearSesion({
      entrada: { tipo: 'NUMERICO', min: 0, max: 10 },
      variable: 'NIVEL_CRAVING',
    });

    await expect(
      responder.execute(sesion, usuario, respuesta(inicio, 6.5)),
    ).rejects.toMatchObject({ codigo: 'TIPO_DATO_INVALIDO' });

    const [{ total }] = await prisma.$queryRaw<{ total: number }[]>`
      SELECT COUNT(*)::int AS total FROM chat.interacciones WHERE id_sesion = ${sesion}::uuid
    `;
    expect(total).toBe(0);
    await expect(
      consultarVariables.listarPorSesion(sesion),
    ).resolves.toBeNull();
  });

  it('crear y deshabilitar suben la versión y quedan auditados; el uso publicado lo impide', async () => {
    const actor = await crearUsuario();
    const codigo = `RF30B_${randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`;
    const antes = (await taxonomia.versionActual()).toString();

    const creada = await new CrearVariableTaxonomiaUseCase(taxonomia).execute(
      {
        codigo,
        nombre: 'Variable de prueba',
        tipo_valor: TipoValorVariable.ENTERO,
        tipos_entrada_permitidos: [TipoEntradaRespuesta.NUMERICO],
        etiquetas: [{ min: 0, max: null, etiqueta: 'CUALQUIERA' }],
      },
      actor,
    );
    expect(creada.version).not.toBe(antes);
    const [{ auditorias }] = await prisma.$queryRaw<{ auditorias: number }[]>`
      SELECT COUNT(*)::int AS auditorias FROM chat.auditoria_arboles
      WHERE id_actor = ${actor}::uuid AND id_flujo IS NULL
        AND accion = 'CREAR_VARIABLE_TAXONOMIA'
    `;
    expect(auditorias).toBe(1);

    await crearSesion({
      entrada: { tipo: 'NUMERICO', min: 0, max: 10 },
      variable: codigo,
      publicado: true,
    });
    const cambiar = new CambiarEstadoVariableTaxonomiaUseCase(taxonomia);
    await expect(cambiar.execute(codigo, false, actor)).rejects.toMatchObject({
      codigo: 'VARIABLE_EN_USO_PUBLICADO',
    });

    const otra = `RF30B_${randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`;
    await new CrearVariableTaxonomiaUseCase(taxonomia).execute(
      {
        codigo: otra,
        nombre: 'Otra',
        tipo_valor: TipoValorVariable.BOOLEANO,
        tipos_entrada_permitidos: [TipoEntradaRespuesta.BOOLEANO],
        etiquetas: { true: 'SI', false: 'NO' },
      },
      actor,
    );
    const deshabilitada = await cambiar.execute(otra, false, actor);
    expect(deshabilitada.variable.habilitada).toBe(false);
    const habilitadas = await new ConsultarTaxonomiaVariablesUseCase(
      taxonomia,
    ).execute();
    expect(habilitadas.version).toBe(deshabilitada.version);
    expect(habilitadas.variables.map((v) => v.codigo)).not.toContain(otra);
  });

  it('dos creaciones concurrentes obtienen versiones distintas', async () => {
    const actor = await crearUsuario();
    const crear = new CrearVariableTaxonomiaUseCase(taxonomia);
    const definicion = (codigo: string) => ({
      codigo,
      nombre: codigo,
      tipo_valor: TipoValorVariable.BOOLEANO,
      tipos_entrada_permitidos: [TipoEntradaRespuesta.BOOLEANO],
      etiquetas: { true: 'SI', false: 'NO' },
    });
    const codigos = [0, 1].map(
      () =>
        `RF30B_${randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`,
    );
    const [a, b] = await Promise.all(
      codigos.map((codigo) => crear.execute(definicion(codigo), actor)),
    );
    expect(a.version).not.toBe(b.version);
  });
});
