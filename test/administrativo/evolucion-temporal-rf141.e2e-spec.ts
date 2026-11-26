import { INestApplication, ValidationPipe } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { PrismaService } from '../../prisma/prisma.service';
import { AdministrativoModule } from '../../src/modules/administrativo/administrativo.module';
import { EvolucionSeguimientoPort } from '../../src/modules/administrativo/application/ports/evolucion-seguimiento.port';
import type { ResultadoEvolucionSeguimiento } from '../../src/modules/administrativo/application/ports/evolucion-seguimiento.port';
import { crearActorConSesion } from './fixtures/actor-con-sesion';

const urlPruebas = process.env.RF141_TEST_DATABASE_URL;
const conPostgres = urlPruebas ? describe : describe.skip;
const fecha = '2026-11-20T05:00:00Z';

conPostgres('RF-141 evolución temporal con PostgreSQL y M05 simulado', () => {
  jest.setTimeout(60_000);
  let app: INestApplication;
  let prisma: PrismaService;
  let admin: Awaited<ReturnType<typeof crearActorConSesion>>;
  let estudiante: typeof admin;
  let cohorte: string;
  const cronograma = randomUUID();
  const unidades = Array.from({ length: 4 }, () => randomUUID());
  const [primera, intermedia, tercera, futura] = unidades;
  const envAnterior = process.env.DATABASE_URL;
  const obtener = jest.fn<Promise<ResultadoEvolucionSeguimiento>, [string]>();

  const ruta = (id: string) => `/admin/cohortes/${id}/evolucion`;
  const servidor = () => app.getHttpServer() as Parameters<typeof request>[0];
  const consultar = (id = cohorte) =>
    request(servidor()).get(ruta(id)).set('Cookie', admin.cookie);

  const punto = (id: string) => ({
    id_unidad_temporal: id,
    adherencia_promedio: 0.7342184,
    nivel_progreso_distribucion: { INICIAL: 2, EN_AVANCE: 0 },
    craving_promedio: 0,
  });
  const actualizado = (datos: Record<string, unknown> = {}, id = cohorte) => ({
    estado: 'ACTUALIZADO' as const,
    id_cohorte: id,
    datos: {
      fecha_actualizacion: fecha,
      id_ultima_unidad_transcurrida: tercera,
      indicadores: [],
      ...datos,
    },
  });

  async function crearCohorte(estado: 'ACTIVA' | 'BORRADOR') {
    const id = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO administrativo.cohortes (id_cohorte, nombre_cohorte, id_cronograma,
        fecha_inicio_programa, fecha_fin_programa, estado, creado_por)
      VALUES (${id}::uuid, ${'Cohorte RF-141 ' + id}, ${cronograma}::uuid,
        '2027-01-01', '2027-01-28', ${estado}::administrativo.estado_cohorte_enum, ${admin.id}::uuid)
    `;
    return id;
  }

  async function crearCronogramaConUnidades() {
    await prisma.$executeRaw`
      INSERT INTO cronograma.cronogramas (id_cronograma, nombre_cronograma)
      VALUES (${cronograma}::uuid, ${'Cronograma RF-141 ' + cronograma})
    `;
    for (const [indice, id] of [...unidades.entries()].reverse()) {
      await prisma.$executeRaw`
        INSERT INTO cronograma.unidades_temporales
          (id_unidad_temporal, id_cronograma, nombre_unidad, orden_unidad, fecha_inicio, fecha_fin)
        VALUES (${id}::uuid, ${cronograma}::uuid, ${'Semana ' + (indice + 1)}, ${indice + 1}::int,
          DATE '2027-01-01' + ${indice * 7}::int, DATE '2027-01-07' + ${indice * 7}::int)
      `;
    }
    await prisma.$executeRaw`
      UPDATE cronograma.cronogramas SET estado = 'ACTIVO', fecha_activacion = now()
      WHERE id_cronograma = ${cronograma}::uuid
    `;
  }

  beforeAll(async () => {
    const url = new URL(urlPruebas ?? '');
    if (
      url.hostname !== '127.0.0.1' ||
      !/^\/brisa_rf141_[a-z0-9_]+$/u.test(url.pathname)
    ) {
      throw new Error(
        'RF-141 requiere una base desechable brisa_rf141_* en localhost.',
      );
    }
    process.env.DATABASE_URL = url.toString();
    const modulo = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot({ global: true }),
        AdministrativoModule,
      ],
    })
      .overrideProvider(EvolucionSeguimientoPort)
      .useValue({ obtener })
      .compile();
    app = modulo.createNestApplication({ logger: false });
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
    admin = await crearActorConSesion(app, prisma, 'ADMINISTRATIVO', 'RF-141');
    estudiante = await crearActorConSesion(app, prisma, 'ESTUDIANTE', 'RF-141');
    await crearCronogramaConUnidades();
    cohorte = await crearCohorte('ACTIVA');
  });

  beforeEach(() => obtener.mockReset());

  afterAll(async () => {
    await app?.close();
    if (envAnterior === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = envAnterior;
  });

  it('alinea las métricas con el catálogo oficial, protege los campos y audita el resultado', async () => {
    obtener.mockResolvedValueOnce(
      actualizado({
        indicadores: [
          { ...punto(tercera), adherencia_promedio: null },
          {
            ...punto(primera),
            participantes: [{ id_usuario: randomUUID() }],
            nivel_progreso_distribucion: {
              INICIAL: 2,
              EN_AVANCE: 0,
              id_usuario: randomUUID(),
            },
          },
        ],
      }),
    );

    const respuesta = await consultar()
      .expect(200)
      .expect('Cache-Control', 'no-store');
    expect(respuesta.body).toEqual({
      id_cohorte: cohorte,
      serie_unidades_temporales: [primera, intermedia, tercera],
      serie_adherencia_promedio: [0.7342184, null, null],
      serie_nivel_progreso_distribucion: [
        { INICIAL: 2, EN_AVANCE: 0 },
        {},
        { INICIAL: 2, EN_AVANCE: 0 },
      ],
      serie_craving_promedio: [0, null, 0],
      unidades_con_datos_insuficientes: [intermedia],
      fecha_actualizacion: fecha,
    });
    expect(obtener).toHaveBeenCalledWith(cohorte);
    expect(
      await prisma.$queryRaw`
      SELECT estado_accion::text AS estado FROM administrativo.bitacora_auditoria
      WHERE id_recurso = ${cohorte}::uuid AND accion = 'CONSULTA_AGREGADA'
        AND recurso_afectado = 'EVOLUCION_TEMPORAL_COHORTE'
        AND id_usuario_administrativo = ${admin.id}::uuid
    `,
    ).toEqual([{ estado: 'EXITOSA' }]);

    const catalogo = await request(servidor())
      .get(`/cronograma/obtener-unidades-temporales/${cronograma}`)
      .set('Cookie', admin.cookie)
      .set('X-CSRF-Token', admin.csrf)
      .expect(200);
    expect(catalogo.body).toHaveLength(unidades.length);
    for (const [indice, idUnidadTemporal] of unidades.entries()) {
      expect(catalogo.body).toContainEqual(
        expect.objectContaining({
          idUnidadTemporal,
          nombreUnidadTemporal: 'Semana ' + (indice + 1),
          orden: indice + 1,
        }),
      );
    }
  });

  it.each([0, 1])(
    'una cohorte con %i unidades transcurridas tiene un estado funcional',
    async (cantidad) => {
      obtener.mockResolvedValueOnce(
        actualizado({
          id_ultima_unidad_transcurrida: cantidad ? primera : null,
        }),
      );
      const respuesta = await consultar().expect(200);
      expect(respuesta.body).toMatchObject({
        serie_unidades_temporales: unidades.slice(0, cantidad),
        unidades_con_datos_insuficientes: unidades.slice(0, cantidad),
      });
      expect(respuesta.body).toHaveProperty(
        'mensaje',
        expect.stringContaining('a partir de la segunda unidad'),
      );
    },
  );

  it('devuelve vacíos explícitos si M05 confirma que ninguna unidad tiene datos consolidados', async () => {
    obtener.mockResolvedValueOnce(actualizado());
    expect((await consultar().expect(200)).body).toMatchObject({
      serie_unidades_temporales: [primera, intermedia, tercera],
      serie_adherencia_promedio: [null, null, null],
      serie_craving_promedio: [null, null, null],
      serie_nivel_progreso_distribucion: [{}, {}, {}],
      unidades_con_datos_insuficientes: [primera, intermedia, tercera],
    });
  });

  it.each(['rechazo', 'indisponible', 'timeout'] as const)(
    'responde 503 sin serie ni copia si M05 reporta %s',
    async (fallo) => {
      if (fallo === 'rechazo')
        obtener.mockRejectedValueOnce(new Error('Caída simulada de M05'));
      if (fallo === 'indisponible')
        obtener.mockResolvedValueOnce({
          estado: 'NO_DISPONIBLE',
          id_cohorte: cohorte,
        });
      if (fallo === 'timeout')
        obtener.mockReturnValueOnce(new Promise(() => undefined));

      const respuesta = await consultar().expect(503);
      expect(respuesta.body).toMatchObject({
        statusCode: 503,
        codigo: 'SEGUIMIENTO_NO_DISPONIBLE',
      });
      expect(respuesta.body).toHaveProperty(
        'mensaje',
        expect.stringContaining(
          'No es posible construir la evolución temporal',
        ),
      );
      expect(respuesta.body).not.toHaveProperty('serie_unidades_temporales');
    },
  );

  it.each([
    ['otra cohorte', () => actualizado({}, randomUUID())],
    [
      'fecha inválida',
      () => actualizado({ fecha_actualizacion: '2026-02-30T00:00:00Z' }),
    ],
    [
      'última unidad ajena',
      () => actualizado({ id_ultima_unidad_transcurrida: randomUUID() }),
    ],
    [
      'indicador para una unidad futura',
      () => actualizado({ indicadores: [punto(futura)] }),
    ],
    [
      'una unidad repetida',
      () => actualizado({ indicadores: [punto(primera), punto(primera)] }),
    ],
    [
      'un conteo inválido',
      () =>
        actualizado({
          indicadores: [
            { ...punto(primera), nivel_progreso_distribucion: { INICIAL: -1 } },
          ],
        }),
    ],
  ])(
    'rechaza una fuente incoherente por %s sin devolver series',
    async (_, fuente) => {
      obtener.mockResolvedValueOnce(fuente());
      const respuesta = await consultar().expect(500);
      expect(respuesta.body).toMatchObject({
        codigo: 'ERROR_CONSTRUCCION_SERIE_TEMPORAL',
      });
      expect(respuesta.body).not.toHaveProperty('serie_unidades_temporales');
    },
  );

  it('verifica autorización, UUID, cohorte activa y filtros antes de invocar M05', async () => {
    await request(servidor()).get(ruta(cohorte)).expect(401);
    await request(servidor())
      .get(ruta(cohorte))
      .set('Cookie', estudiante.cookie)
      .expect(403);
    await consultar('no-es-uuid').expect(400);
    await consultar(randomUUID()).expect(404);
    expect(
      (await consultar(await crearCohorte('BORRADOR')).expect(404)).body,
    ).toMatchObject({
      codigo: 'COHORTE_ACTIVA_NO_ENCONTRADA',
    });
    expect(
      (await consultar().query({ modalidad_terapeutica: 'GRUPAL' }).expect(400))
        .body,
    ).toMatchObject({
      codigo: 'FILTROS_RF135_NO_DISPONIBLES',
    });
    expect(obtener).not.toHaveBeenCalled();
  });

  it('aborta la entrega de la serie si falla la auditoría síncrona', async () => {
    await prisma.$executeRaw`
      CREATE FUNCTION administrativo.fn_prueba_fallar_rf141() RETURNS trigger
      LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Fallo controlado de auditoría RF-141'; END $$
    `;
    await prisma.$executeRaw`
      CREATE TRIGGER trg_prueba_fallar_rf141 BEFORE INSERT ON administrativo.bitacora_auditoria
      FOR EACH ROW WHEN (
        NEW.recurso_afectado = 'EVOLUCION_TEMPORAL_COHORTE' AND NEW.estado_accion = 'EXITOSA'
      ) EXECUTE FUNCTION administrativo.fn_prueba_fallar_rf141()
    `;
    try {
      obtener.mockResolvedValueOnce(
        actualizado({ indicadores: [punto(primera)] }),
      );
      const respuesta = await consultar().expect(500);
      expect(respuesta.body).toMatchObject({
        codigo: 'ERROR_REGISTRO_AUDITORIA',
      });
      expect(respuesta.body).not.toHaveProperty('serie_unidades_temporales');
    } finally {
      await prisma.$executeRaw`DROP TRIGGER trg_prueba_fallar_rf141 ON administrativo.bitacora_auditoria`;
      await prisma.$executeRaw`DROP FUNCTION administrativo.fn_prueba_fallar_rf141()`;
    }
  });
});
