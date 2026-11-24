import { EventEmitterModule } from '@nestjs/event-emitter';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { PrismaService } from '../../prisma/prisma.service';
import { AdministrativoModule } from '../../src/modules/administrativo/administrativo.module';
import { BitacoraRepository } from '../../src/modules/administrativo/application/ports/auditoria.port';
import type { ResultadoFuenteAgregada } from '../../src/modules/administrativo/application/ports/fuente-vista-agregada.port';
import { NarrativaAgregadaPort } from '../../src/modules/administrativo/application/ports/narrativa-agregada.port';
import { NotificacionesAgregadasPort } from '../../src/modules/administrativo/application/ports/notificaciones-agregadas.port';
import { SeguimientoAgregadoPort } from '../../src/modules/administrativo/application/ports/seguimiento-agregado.port';
import { crearActorConSesion } from './fixtures/actor-con-sesion';

const urlPruebas = process.env.RF140_TEST_DATABASE_URL;
const conPostgres = urlPruebas ? describe : describe.skip;
const ruta = '/admin/dashboard';
const fecha = '2026-11-23T11:10:00.000Z';
const indicadorConductual = {
  tasa_adherencia_promedio: 0.74215,
  alertas_inactividad_pendientes: 2,
  alertas_craving_pendientes: 3,
};
type Actor = Awaited<ReturnType<typeof crearActorConSesion>>;

function actualizado(
  id_cohorte: string,
  datos: Record<string, unknown>,
): ResultadoFuenteAgregada {
  return {
    id_cohorte,
    estado: 'ACTUALIZADO',
    datos: { ...datos, fecha_actualizacion: fecha },
  };
}

conPostgres('Dashboard RF-140 con PostgreSQL y fuentes simuladas', () => {
  jest.setTimeout(90_000);
  let app: INestApplication;
  let prisma: PrismaService;
  let admin: Actor;
  let estudiante: Actor;
  const cronograma = randomUUID();
  const anterior = process.env.DATABASE_URL;
  const conductual = jest.fn<Promise<ResultadoFuenteAgregada>, [string]>();
  const narrativa = jest.fn<Promise<ResultadoFuenteAgregada>, [string]>();
  const notificaciones = jest.fn<Promise<ResultadoFuenteAgregada>, [string]>();
  const fuentes = [conductual, narrativa, notificaciones];

  function servidor() {
    return app.getHttpServer() as Parameters<typeof request>[0];
  }

  const consultar = () =>
    request(servidor()).get(ruta).set('Cookie', admin.cookie);

  async function crearCohorte(estado: 'ACTIVA' | 'BORRADOR' = 'ACTIVA') {
    const id = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO administrativo.cohortes (
        id_cohorte, nombre_cohorte, id_cronograma, fecha_inicio_programa, fecha_fin_programa, estado, creado_por
      ) VALUES (
        ${id}::uuid, ${'Cohorte RF-140 ' + id}, ${cronograma}::uuid, '2026-11-30', '2027-04-30',
        ${estado}::administrativo.estado_cohorte_enum, ${admin.id}::uuid
      )
    `;
    return id;
  }

  const auditoria = (id: string | null) => prisma.$queryRaw<
    { estado: string }[]
  >`
    SELECT estado_accion::text AS estado FROM administrativo.bitacora_auditoria
    WHERE recurso_afectado = 'DASHBOARD_PRINCIPAL_COHORTE'
      AND accion = 'CONSULTA_AGREGADA' AND id_recurso IS NOT DISTINCT FROM ${id}::uuid
      AND id_usuario_administrativo = ${admin.id}::uuid
    ORDER BY marca_temporal, id_auditoria
  `;

  beforeAll(async () => {
    const url = new URL(urlPruebas ?? '');
    if (
      url.hostname !== '127.0.0.1' ||
      !/^\/brisa_rf140_[a-z0-9_]+$/u.test(url.pathname)
    ) {
      throw new Error(
        'RF-140 requiere una base desechable brisa_rf140_* en localhost.',
      );
    }
    process.env.DATABASE_URL = url.toString();
    const modulo = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot({ global: true }),
        AdministrativoModule,
      ],
    })
      .overrideProvider(SeguimientoAgregadoPort)
      .useValue({ obtener: conductual })
      .overrideProvider(NarrativaAgregadaPort)
      .useValue({ obtener: narrativa })
      .overrideProvider(NotificacionesAgregadasPort)
      .useValue({ obtener: notificaciones })
      .compile();
    app = modulo.createNestApplication({ logger: false });
    app.use(cookieParser());
    await app.init();

    prisma = app.get(PrismaService);
    admin = await crearActorConSesion(app, prisma, 'ADMINISTRATIVO', 'RF-140');
    estudiante = await crearActorConSesion(app, prisma, 'ESTUDIANTE', 'RF-140');
    await prisma.$executeRaw`
      INSERT INTO cronograma.cronogramas (id_cronograma, nombre_cronograma, estado, fecha_activacion)
      VALUES (${cronograma}::uuid, ${'Cronograma RF-140 ' + cronograma}, 'ACTIVO', now())
    `;
  });

  beforeEach(() => {
    for (const fuente of fuentes) fuente.mockReset();
    conductual.mockImplementation((id) =>
      Promise.resolve(actualizado(id, indicadorConductual)),
    );
    narrativa.mockImplementation((id) =>
      Promise.resolve(actualizado(id, { total_logros_desbloqueados: 29 })),
    );
    notificaciones.mockImplementation((id) =>
      Promise.resolve(actualizado(id, { total_notificaciones_enviadas: 0 })),
    );
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await prisma?.$executeRaw(Prisma.sql`
      UPDATE administrativo.cohortes SET estado = 'INACTIVA'
      WHERE id_cronograma = ${cronograma}::uuid AND estado = 'ACTIVA'
    `);
  });

  afterAll(async () => {
    await app?.close();
    if (anterior === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = anterior;
  });

  it('exige sesión y rol administrativo antes de consultar fuentes', async () => {
    await request(servidor()).get(ruta).expect(401);
    await request(servidor())
      .get(ruta)
      .set('Cookie', estudiante.cookie)
      .expect(403);
    for (const fuente of fuentes) expect(fuente).not.toHaveBeenCalled();
  });

  it('una cohorte en borrador no impide el 200 funcional sin cohorte activa', async () => {
    await crearCohorte('BORRADOR');
    const respuesta = await consultar()
      .expect(200)
      .expect('Cache-Control', 'no-store');
    expect(respuesta.body).toMatchObject({
      id_cohorte: null,
      estado: 'SIN_COHORTE_ACTIVA',
      vista_conductual: null,
      vista_narrativa: null,
      vista_notificaciones: null,
      total_alertas_criticas_pendientes: null,
      advertencias: [],
    });
    expect(respuesta.body).toHaveProperty(
      'mensaje',
      expect.stringContaining('Cree o active una cohorte'),
    );
    for (const fuente of fuentes) expect(fuente).not.toHaveBeenCalled();
    expect(await auditoria(null)).toEqual([{ estado: 'EXITOSA' }]);
  });

  it('varias cohortes activas producen 409 antes de acceder a indicadores', async () => {
    await crearCohorte();
    await crearCohorte();
    const respuesta = await consultar().expect(409);
    expect(respuesta.body).toHaveProperty('codigo', 'COHORTE_ACTIVA_AMBIGUA');
    expect(respuesta.body).not.toHaveProperty('vista_conductual');
    for (const fuente of fuentes) expect(fuente).not.toHaveBeenCalled();
  });

  it('descarta el panel si aparece otra cohorte activa durante la consulta', async () => {
    const id = await crearCohorte();
    narrativa.mockImplementationOnce(async (idCohorte) => {
      await crearCohorte();
      return actualizado(idCohorte, { total_logros_desbloqueados: 15 });
    });

    const respuesta = await consultar().expect(409);
    expect(respuesta.body).toHaveProperty('codigo', 'COHORTE_ACTIVA_AMBIGUA');
    expect(respuesta.body).not.toHaveProperty('vista_narrativa');
    expect(await auditoria(id)).toEqual([{ estado: 'FALLIDA' }]);
  });

  it('inicia las tres consultas en paralelo y solo suma los dos conteos de alertas', async () => {
    const id = await crearCohorte();
    const esperas: Array<() => void> = [];
    const datos = [
      {
        ...indicadorConductual,
        participantes: [{ correo: 'privado@example.invalid' }],
      },
      { total_logros_desbloqueados: 29 },
      { total_notificaciones_enviadas: 0, tasa_conversion_promedio: null },
    ];
    fuentes.forEach((fuente, indice) =>
      fuente.mockImplementationOnce(
        (idCohorte) =>
          new Promise((resolve) => {
            esperas.push(() => resolve(actualizado(idCohorte, datos[indice])));
            if (esperas.length === fuentes.length)
              esperas.forEach((completar) => completar());
          }),
      ),
    );

    const respuesta = await consultar().expect(200);
    for (const fuente of fuentes) expect(fuente).toHaveBeenCalledWith(id);
    expect(respuesta.body).toMatchObject({
      id_cohorte: id,
      estado: 'DISPONIBLE',
      vista_conductual: { estado: 'DISPONIBLE', datos: indicadorConductual },
      vista_narrativa: { datos: { total_logros_desbloqueados: 29 } },
      vista_notificaciones: {
        datos: {
          total_notificaciones_enviadas: 0,
          tasa_conversion_promedio: null,
        },
      },
      total_alertas_criticas_pendientes: 5,
      advertencias: [],
    });
    expect(respuesta.body).toHaveProperty(
      'fecha_carga_pantalla',
      expect.stringMatching(/Z$/u),
    );
    expect(respuesta.text).not.toContain('privado@example.invalid');
    expect(await auditoria(id)).toEqual([{ estado: 'EXITOSA' }]);
  });

  it('un timeout deja la sección indisponible y conserva las otras dos', async () => {
    await crearCohorte();
    narrativa.mockImplementationOnce(() => new Promise(() => undefined));
    const respuesta = await consultar().expect(200);
    expect(respuesta.body).toMatchObject({
      estado: 'PARCIAL',
      vista_conductual: { estado: 'DISPONIBLE' },
      vista_narrativa: {
        estado: 'NO_DISPONIBLE',
        estado_agregacion: 'ERROR_ACTUALIZACION',
        datos: null,
      },
      vista_notificaciones: { estado: 'DISPONIBLE' },
      total_alertas_criticas_pendientes: 5,
    });
    expect(respuesta.body).toHaveProperty('advertencias', [
      'La vista de progresión narrativa no está disponible en este momento. Se muestra el panorama con la información restante disponible.',
    ]);
  });

  it.each([
    [
      'conteos en cero',
      { alertas_inactividad_pendientes: 0, alertas_craving_pendientes: 0 },
      0,
    ],
    ['conteo ausente', { alertas_inactividad_pendientes: 2 }, null],
  ])(
    'preserva %s y distingue una vista pendiente de una fuente caída',
    async (_, conteos, total) => {
      await crearCohorte();
      conductual.mockImplementationOnce((id) =>
        Promise.resolve(actualizado(id, conteos)),
      );
      narrativa.mockImplementationOnce((id_cohorte) =>
        Promise.resolve({ id_cohorte, estado: 'PENDIENTE' }),
      );
      const respuesta = await consultar().expect(200);
      expect(respuesta.body).toMatchObject({
        estado: 'DISPONIBLE',
        vista_narrativa: {
          estado_agregacion: 'PENDIENTE',
          motivo_sin_datos: 'SIN_CONSOLIDAR',
        },
        total_alertas_criticas_pendientes: total,
      });
    },
  );

  it('si fallan las tres fuentes devuelve 503 y conserva solo respaldos de la misma cohorte', async () => {
    const id = await crearCohorte();
    await consultar().expect(200);
    for (const fuente of fuentes)
      fuente.mockRejectedValue(new Error('Caída simulada'));
    const conRespaldo = await consultar()
      .expect(503)
      .expect('Cache-Control', 'no-store');
    expect(conRespaldo.body).toMatchObject({
      codigo: 'FUENTES_DASHBOARD_NO_DISPONIBLES',
      estado: 'DESACTUALIZADO',
      id_cohorte: id,
      vista_conductual: {
        estado: 'DESACTUALIZADA',
        ultimo_timestamp_disponible: fecha,
      },
      vista_narrativa: { estado: 'DESACTUALIZADA' },
      vista_notificaciones: { estado: 'DESACTUALIZADA' },
      total_alertas_criticas_pendientes: 5,
    });
    expect(await auditoria(id)).toEqual([
      { estado: 'EXITOSA' },
      { estado: 'FALLIDA' },
    ]);

    await prisma.$executeRaw`UPDATE administrativo.cohortes SET estado = 'INACTIVA' WHERE id_cohorte = ${id}::uuid`;
    const nueva = await crearCohorte();
    const sinRespaldo = await consultar().expect(503);
    expect(sinRespaldo.body).toMatchObject({
      id_cohorte: nueva,
      estado: 'NO_DISPONIBLE',
      vista_conductual: { estado: 'NO_DISPONIBLE', datos: null },
      vista_narrativa: { estado: 'NO_DISPONIBLE', datos: null },
      vista_notificaciones: { estado: 'NO_DISPONIBLE', datos: null },
      total_alertas_criticas_pendientes: null,
    });
  });

  it.each(['DASHBOARD_PRINCIPAL_COHORTE', 'VISTA_AGREGADA_NARRATIVA'])(
    'aborta la respuesta si no se puede auditar %s',
    async (recurso) => {
      await crearCohorte();
      const bitacora = app.get<BitacoraRepository>(BitacoraRepository);
      const insertar = bitacora.insertar.bind(
        bitacora,
      ) as BitacoraRepository['insertar'];
      jest
        .spyOn(bitacora, 'insertar')
        .mockImplementation((tx, registro, diferido) =>
          registro.recurso_afectado === recurso
            ? Promise.reject(new Error('Bitácora no disponible'))
            : insertar(tx, registro, diferido),
        );

      const respuesta = await consultar().expect(500);
      expect(respuesta.body).toHaveProperty(
        'codigo',
        'ERROR_REGISTRO_AUDITORIA',
      );
      expect(respuesta.body).not.toHaveProperty('vista_conductual');
    },
  );
});
