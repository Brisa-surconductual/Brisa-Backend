import { Logger } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { PrismaService } from '../../prisma/prisma.service';
import { AdministrativoModule } from '../../src/modules/administrativo/administrativo.module';
import { BitacoraRepository } from '../../src/modules/administrativo/application/ports/auditoria.port';
import type { ResultadoFuenteAgregada } from '../../src/modules/administrativo/application/ports/fuente-vista-agregada.port';
import { NotificacionesAgregadasPort } from '../../src/modules/administrativo/application/ports/notificaciones-agregadas.port';
import { SeguimientoAgregadoPort } from '../../src/modules/administrativo/application/ports/seguimiento-agregado.port';
import { COLUMNAS_EXPORTACION_COHORTE } from '../../src/modules/administrativo/domain/enums/columna-exportacion-cohorte.enum';
import { crearActorConSesion } from './fixtures/actor-con-sesion';

const urlPruebas = process.env.RF144_TEST_DATABASE_URL;
const conPostgres = urlPruebas ? describe : describe.skip;
const fecha = '2026-11-23T06:10:00-05:00';
const rutaCohorte = (id: string) => `/admin/cohortes/${id}`;
const ruta = (id: string) => `${rutaCohorte(id)}/exportacion.csv`;
const METRICAS_CONDUCTUALES = {
  total_usuarios_activos: 8,
  distribucion_niveles_progreso: [
    { nivel: 'INICIAL', total_usuarios: 0 },
    { nivel: 'EN_AVANCE', total_usuarios: 5 },
  ],
  tasa_adherencia_promedio: 0.7342184,
  alertas_inactividad_pendientes: 0,
  alertas_craving_pendientes: 3,
};
const METRICAS_NOTIFICACIONES = {
  tasa_apertura_promedio: 0.612345,
  tasa_conversion_promedio: null,
  total_notificaciones_enviadas: 8,
  total_notificaciones_entregadas: 8,
  total_notificaciones_descartadas: 0,
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

conPostgres('Exportación CSV RF-144 en PostgreSQL', () => {
  jest.setTimeout(90_000);
  let app: INestApplication;
  let prisma: PrismaService;
  let admin: Actor;
  let estudiante: Actor;
  const cronograma = randomUUID();
  const anterior = process.env.DATABASE_URL;
  const conductual = jest.fn<Promise<ResultadoFuenteAgregada>, [string]>();
  const notificaciones = jest.fn<Promise<ResultadoFuenteAgregada>, [string]>();

  const servidor = () => app.getHttpServer() as Parameters<typeof request>[0];
  const descargar = (id: string, actor = admin) =>
    request(servidor()).get(ruta(id)).set('Cookie', actor.cookie);

  async function crearCohorte(estado: 'ACTIVA' | 'BORRADOR' = 'ACTIVA') {
    const id = randomUUID();
    const nombre = 'Cohorte "Psicología", ' + id;
    await prisma.$executeRaw`
      INSERT INTO administrativo.cohortes (
        id_cohorte, nombre_cohorte, id_cronograma, fecha_inicio_programa, fecha_fin_programa, estado, creado_por
      ) VALUES (
        ${id}::uuid, ${nombre}, ${cronograma}::uuid, '2026-11-01', '2027-04-30',
        ${estado}::administrativo.estado_cohorte_enum, ${admin.id}::uuid
      )
    `;
    return { id, nombre };
  }

  const bitacora = (id: string | null) => prisma.$queryRaw<
    {
      actor: string | null;
      sesion: string | null;
      ip: string;
      estado: string;
      diferido: boolean;
      detalle: unknown;
    }[]
  >`
    SELECT id_usuario_administrativo AS actor, id_sesion AS sesion, direccion_ip AS ip,
      estado_accion::text AS estado, registrado_diferido AS diferido, detalle
    FROM administrativo.bitacora_auditoria
    WHERE recurso_afectado = 'EXPORTACION_CSV_COHORTE' AND accion = 'EXPORTACION_DATOS'
      AND id_recurso IS NOT DISTINCT FROM ${id}::uuid
    ORDER BY marca_temporal, id_auditoria
  `;

  beforeAll(async () => {
    const url = new URL(urlPruebas ?? '');
    if (
      url.hostname !== '127.0.0.1' ||
      !/^\/brisa_rf144_[a-z0-9_]+$/u.test(url.pathname)
    )
      throw new Error(
        'RF-144 requiere una base desechable brisa_rf144_* en localhost.',
      );
    process.env.DATABASE_URL = url.toString();

    const modulo = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot({ global: true }),
        AdministrativoModule,
      ],
    })
      .overrideProvider(SeguimientoAgregadoPort)
      .useValue({ obtener: conductual })
      .overrideProvider(NotificacionesAgregadasPort)
      .useValue({ obtener: notificaciones })
      .compile();
    app = modulo.createNestApplication({ logger: false });
    app.use(cookieParser());
    await app.init();
    prisma = app.get(PrismaService);
    admin = await crearActorConSesion(app, prisma, 'ADMINISTRATIVO', 'RF-144');
    estudiante = await crearActorConSesion(app, prisma, 'ESTUDIANTE', 'RF-144');
    await prisma.$executeRaw`
      INSERT INTO cronograma.cronogramas (id_cronograma, nombre_cronograma, estado, fecha_activacion)
      VALUES (${cronograma}::uuid, ${'Cronograma RF-144 ' + cronograma}, 'ACTIVO', now())
    `;
  });

  beforeEach(() => {
    conductual
      .mockReset()
      .mockImplementation((id) =>
        Promise.resolve(actualizado(id, METRICAS_CONDUCTUALES)),
      );
    notificaciones
      .mockReset()
      .mockImplementation((id) =>
        Promise.resolve(actualizado(id, METRICAS_NOTIFICACIONES)),
      );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app?.close();
    if (anterior === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = anterior;
  });

  it('descarga las mismas métricas que las vistas y registra el archivo antes de entregarlo', async () => {
    const { id, nombre } = await crearCohorte();
    const [vistaConductual, vistaNotificaciones] = await Promise.all([
      request(servidor())
        .get(rutaCohorte(id) + '/vista-agregada')
        .set('Cookie', admin.cookie)
        .expect(200),
      request(servidor())
        .get(rutaCohorte(id) + '/vistas/notificaciones')
        .set('Cookie', admin.cookie)
        .expect(200),
    ]);
    expect(vistaConductual.body).toMatchObject({
      datos: METRICAS_CONDUCTUALES,
    });
    expect(vistaNotificaciones.body).toMatchObject({
      datos: METRICAS_NOTIFICACIONES,
    });

    const archivo = await descargar(id)
      .expect(200)
      .expect('Content-Type', 'text/csv; charset=utf-8')
      .expect('Cache-Control', 'no-store');
    const nombreArchivo = archivo
      .get('Content-Disposition')
      .match(
        /^attachment; filename="(indicadores_cohorte_activa_\d{8}\.csv)"$/u,
      )?.[1];
    expect(nombreArchivo).toBeDefined();
    const csv = archivo.text;
    const cabecera = csv.slice(1).split('\r\n')[0].split(',');
    expect(cabecera).toEqual(COLUMNAS_EXPORTACION_COHORTE);
    expect(cabecera).toHaveLength(18);
    expect(csv).toBe(
      '\uFEFF' +
        cabecera.join(',') +
        '\r\n"' +
        nombre.replaceAll('"', '""') +
        '",DISPONIBLE,' +
        fecha +
        ',8,0,5,No disponible,No disponible,0.7342184,0,3,DISPONIBLE,' +
        fecha +
        ',0.612345,No disponible,8,8,0\r\n',
    );
    const bytes = Buffer.byteLength(csv, 'utf8');
    expect(archivo.get('Content-Length')).toBe(String(bytes));
    const [evento] = await bitacora(id);
    expect(evento).toMatchObject({
      actor: admin.id,
      estado: 'EXITOSA',
      diferido: false,
      detalle: { nombre_archivo: nombreArchivo, tamano_bytes: bytes },
    });
    expect(evento.sesion).toMatch(/^[0-9a-f-]{36}$/u);
    expect(evento.ip).not.toBe('DESCONOCIDA');
  });

  it('mantiene el mismo CSV sin PII y registra WARN para los selectores de columnas', async () => {
    const { id } = await crearCohorte();
    const warn = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    const original = await descargar(id).expect(200);
    conductual.mockImplementationOnce((idCohorte) =>
      Promise.resolve(
        actualizado(idCohorte, {
          ...METRICAS_CONDUCTUALES,
          correo: 'privado@example.invalid',
          usuario: { id_usuario: 'usuario-individual' },
        }),
      ),
    );
    notificaciones.mockImplementationOnce((idCohorte) =>
      Promise.resolve(
        actualizado(idCohorte, {
          ...METRICAS_NOTIFICACIONES,
          participantes: [{ telefono: '3000000001' }],
          codigo_participante: 'P-PRIVADO',
        }),
      ),
    );
    const exportacion = await descargar(id)
      .query({ include_pii: 'true' })
      .expect(200);
    const porColumnas = await descargar(id)
      .query({ fields: 'correo,id_usuario' })
      .expect(200);
    expect(exportacion.text).toBe(original.text);
    expect(porColumnas.text).toBe(original.text);
    expect(exportacion.text).not.toMatch(
      /privado|usuario-individual|telefono|3000000001|P-PRIVADO/u,
    );
    expect(exportacion.text.slice(1).split('\r\n')[0].split(',')).toEqual(
      COLUMNAS_EXPORTACION_COHORTE,
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(
        `Usuario: ${admin.id}, Cohorte: ${id}. Petición sanitizada.`,
      ),
    );
    expect(
      warn.mock.calls.filter(
        ([message]) =>
          typeof message === 'string' &&
          message.includes('Petición sanitizada.'),
      ),
    ).toHaveLength(2);
  });

  it('audita al usuario sin permiso y al intento sin sesión antes de acceder a las fuentes', async () => {
    const { id } = await crearCohorte();
    const sinSesion = await request(servidor()).get(ruta(id)).expect(401);
    expect(sinSesion.get('Content-Disposition')).toBeUndefined();
    const denegada = await descargar(id, estudiante).expect(403);
    expect(denegada.body).toHaveProperty('codigo', 'ACCESO_DENEGADO');
    expect(denegada.get('Content-Disposition')).toBeUndefined();
    expect(await bitacora(id)).toMatchObject([
      { estado: 'DENEGADA', actor: null, sesion: null },
      { estado: 'DENEGADA', actor: estudiante.id },
    ]);
    expect(conductual).not.toHaveBeenCalled();
    expect(notificaciones).not.toHaveBeenCalled();
  });

  it('rechaza UUID inválido y audita el intento sin guardar la entrada inválida', async () => {
    await descargar('identificador-invalido').expect(400);
    expect(
      (await bitacora(null)).find(({ actor }) => actor === admin.id),
    ).toMatchObject({ estado: 'FALLIDA', actor: admin.id });
    expect(conductual).not.toHaveBeenCalled();
  });

  it('responde 422 para una cohorte en borrador o inexistente', async () => {
    const borrador = await crearCohorte('BORRADOR');
    for (const id of [borrador.id, randomUUID()]) {
      const respuesta = await descargar(id).expect(422);
      expect(respuesta.body).toHaveProperty('codigo', 'COHORTE_NO_ACTIVA');
      expect(respuesta.get('Content-Disposition')).toBeUndefined();
      expect(await bitacora(id)).toMatchObject([{ estado: 'FALLIDA' }]);
    }
    expect(conductual).not.toHaveBeenCalled();
  });

  it.each(['PENDIENTE', 'SUPRIMIDO'] as const)(
    'impide exportar si la vista conductual está %s',
    async (estado) => {
      const { id } = await crearCohorte();
      conductual.mockResolvedValueOnce({ id_cohorte: id, estado });
      const respuesta = await descargar(id).expect(422);
      expect(respuesta.body).toHaveProperty(
        'codigo',
        'SIN_INDICADORES_CONSOLIDADOS',
      );
      expect(await bitacora(id)).toMatchObject([{ estado: 'FALLIDA' }]);
    },
  );

  it('degrada las notificaciones y conserva métricas conductuales', async () => {
    const { id } = await crearCohorte();
    notificaciones.mockRejectedValueOnce(new Error('M07 caído'));
    const archivo = await descargar(id).expect(200);
    expect(archivo.text).toContain(
      ',0.7342184,0,3,NO_DISPONIBLE,No disponible,No disponible,No disponible,No disponible,No disponible,No disponible\r\n',
    );
  });

  it('conserva los respaldos de las vistas con su estado y fecha original', async () => {
    const { id } = await crearCohorte();
    await descargar(id).expect(200);
    conductual.mockRejectedValueOnce(new Error('M05 caído'));
    notificaciones.mockRejectedValueOnce(new Error('M07 caído'));
    const archivo = await descargar(id).expect(200);
    expect(archivo.text).toContain(`,DESACTUALIZADA,${fecha},8,0,5`);
    expect(archivo.text).toContain(
      `,DESACTUALIZADA,${fecha},0.612345,No disponible,8,8,0`,
    );
  });

  it('devuelve 500 cuando se cae la fuente obligatoria sin respaldo', async () => {
    const { id } = await crearCohorte();
    conductual.mockRejectedValueOnce(new Error('M05 caído'));
    const respuesta = await descargar(id).expect(500);
    expect(respuesta.body).toHaveProperty('codigo', 'ERROR_GENERACION_CSV');
    expect(respuesta.get('Content-Disposition')).toBeUndefined();
    expect(await bitacora(id)).toMatchObject([{ estado: 'FALLIDA' }]);
  });

  it('si falla la escritura de auditoría devuelve error y no envía el archivo', async () => {
    const { id } = await crearCohorte();
    const repo = app.get<BitacoraRepository>(BitacoraRepository);
    const insertar = repo.insertar.bind(repo) as BitacoraRepository['insertar'];
    jest
      .spyOn(repo, 'insertar')
      .mockImplementation((tx, registro, diferido) =>
        registro.accion === 'EXPORTACION_DATOS' &&
        registro.estado_accion === 'EXITOSA'
          ? Promise.reject(new Error('Bitácora no disponible'))
          : insertar(tx, registro, diferido),
      );
    const respuesta = await descargar(id).expect(500);
    expect(respuesta.body).toHaveProperty('codigo', 'ERROR_REGISTRO_AUDITORIA');
    expect(respuesta.get('Content-Disposition')).toBeUndefined();
    expect(await bitacora(id)).toMatchObject([{ estado: 'FALLIDA' }]);
  });
});
