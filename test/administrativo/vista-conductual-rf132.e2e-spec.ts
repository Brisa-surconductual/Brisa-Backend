import { INestApplication, ValidationPipe } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { createHash, randomUUID } from 'node:crypto';
import request from 'supertest';
import { PrismaService } from '../../prisma/prisma.service';
import { AdministrativoModule } from '../../src/modules/administrativo/administrativo.module';
import { NarrativaAgregadaPort } from '../../src/modules/administrativo/application/ports/narrativa-agregada.port';
import { NotificacionesAgregadasPort } from '../../src/modules/administrativo/application/ports/notificaciones-agregadas.port';
import { SeguimientoAgregadoPort } from '../../src/modules/administrativo/application/ports/seguimiento-agregado.port';
import type { ResultadoSeguimientoAgregado } from '../../src/modules/administrativo/application/ports/seguimiento-agregado.port';
import { SessionCookieConfig } from '../../src/modules/usuarios/application/ports/session-cookie-config';

const urlPruebas = process.env.RF132_TEST_DATABASE_URL;
const conPostgres = urlPruebas ? describe : describe.skip;
const base = '/admin/cohortes';
const DATOS = {
  total_usuarios_activos: 3,
  distribucion_niveles_progreso: [{ nivel: 'INICIAL', total_usuarios: 2 }],
  tasa_adherencia_promedio: 0.7342184,
  alertas_inactividad_pendientes: 0,
  alertas_craving_pendientes: 1,
  fecha_actualizacion: '2026-11-23T06:10:00-05:00',
};
const FECHA_UTC = '2026-11-23T11:10:00.000Z';

conPostgres('Vistas agregadas con PostgreSQL y fuentes simuladas', () => {
  jest.setTimeout(60_000);
  let app: INestApplication;
  let prisma: PrismaService;
  let admin: { id: string; cookie: string };
  let estudiante: typeof admin;
  const cronograma = randomUUID();
  const envAnterior = process.env.DATABASE_URL;
  const obtener = jest.fn<Promise<ResultadoSeguimientoAgregado>, [string]>();
  const obtenerNarrativa = jest.fn<
    Promise<ResultadoSeguimientoAgregado>,
    [string]
  >();
  const obtenerNotificaciones = jest.fn<
    Promise<ResultadoSeguimientoAgregado>,
    [string]
  >();

  async function crearActor(rol: 'ADMINISTRATIVO' | 'ESTUDIANTE') {
    const id = randomUUID();
    const token = randomUUID();
    const hash = createHash('sha256').update(token).digest('hex');
    const consentimiento = rol === 'ESTUDIANTE' ? randomUUID() : null;
    if (consentimiento) {
      await prisma.$executeRaw`
        INSERT INTO usuario.consentimientos
          (id_consentimiento, version_consentimiento, vigente, fecha_invalidacion, motivo_invalidacion, url_contenido, titulo)
        VALUES (${consentimiento}::uuid, ${consentimiento.slice(0, 18)}, false, now(),
          'Prueba RF-132', 'https://example.invalid/consentimiento', 'Consentimiento RF-132')
      `;
    }
    await prisma.$executeRaw`
      INSERT INTO usuario.usuarios (id_usuario, correo_electronico, contrasena_hash,
        rol, estado_registro, consentimiento_aceptado, registro_consumo_aceptado, id_consentimiento)
      VALUES (${id}::uuid, ${id + '@example.invalid'}, ${randomUUID()}, ${rol}::usuario.rol_enum,
        'REGISTRO_COMPLETO', true, true, ${consentimiento}::uuid)
    `;
    await prisma.$executeRaw`
      INSERT INTO usuario.sesiones (id_usuario, token_hash, csrf_token_hash, alcance_sesion)
      VALUES (${id}::uuid, ${hash}, ${randomUUID()}, 'COMPLETA')
    `;
    const cookie = app.get(SessionCookieConfig).obtenerNombreCookie();
    return { id, cookie: `${cookie}=${token}` };
  }

  async function crearCohorte(estado: 'ACTIVA' | 'BORRADOR' = 'ACTIVA') {
    const id = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO administrativo.cohortes (id_cohorte, nombre_cohorte, id_cronograma,
        fecha_inicio_programa, fecha_fin_programa, estado, creado_por)
      VALUES (${id}::uuid, ${'Cohorte RF-132 ' + id}, ${cronograma}::uuid,
        '2026-11-30', '2027-04-30', ${estado}::administrativo.estado_cohorte_enum, ${admin.id}::uuid)
    `;
    return id;
  }

  const servidor = () => app.getHttpServer() as Parameters<typeof request>[0];
  const ruta = (id: string) => `${base}/${id}/vista-agregada`;
  const consultar = (id: string) =>
    request(servidor()).get(ruta(id)).set('Cookie', admin.cookie);
  const snapshots = (id: string) => prisma.$queryRaw<{ payload: unknown }[]>`
    SELECT payload FROM administrativo.snapshots_vista WHERE id_cohorte = ${id}::uuid AND vista = 'CONDUCTUAL'
  `;
  const actualizado = (
    id: string,
    datos: unknown = DATOS,
  ): ResultadoSeguimientoAgregado => ({
    id_cohorte: id,
    estado: 'ACTUALIZADO',
    datos,
  });

  beforeAll(async () => {
    const url = new URL(urlPruebas ?? '');
    if (
      url.hostname !== '127.0.0.1' ||
      !/^\/brisa_rf132_[a-z0-9_]+$/u.test(url.pathname)
    ) {
      throw new Error(
        'RF-132 requiere una base desechable brisa_rf132_* en localhost.',
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
      .useValue({ obtener })
      .overrideProvider(NarrativaAgregadaPort)
      .useValue({ obtener: obtenerNarrativa })
      .overrideProvider(NotificacionesAgregadasPort)
      .useValue({ obtener: obtenerNotificaciones })
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
    admin = await crearActor('ADMINISTRATIVO');
    estudiante = await crearActor('ESTUDIANTE');
    await prisma.$executeRaw`
      INSERT INTO cronograma.cronogramas (id_cronograma, nombre_cronograma, estado, fecha_activacion)
      VALUES (${cronograma}::uuid, 'Cronograma RF-132', 'ACTIVO', now())
    `;
  });

  beforeEach(() => {
    obtener.mockReset();
    obtener.mockImplementation((id_cohorte) =>
      Promise.resolve({ id_cohorte, estado: 'NO_DISPONIBLE' }),
    );
  });

  afterAll(async () => {
    await app?.close();
    if (envAnterior === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = envAnterior;
  });

  it('sirve, audita y guarda exclusivamente la proyección agregada y sus valores originales', async () => {
    const id = await crearCohorte();
    obtener.mockResolvedValueOnce(
      actualizado(id, {
        ...DATOS,
        id_usuario: randomUUID(),
        participantes: [{ correo: 'individual@example.invalid' }],
        distribucion_niveles_progreso: [
          {
            nivel: 'INICIAL',
            total_usuarios: 2,
            codigo_participante: 'P-12345678',
          },
          { nivel: 'individual@example.invalid', total_usuarios: 1 },
        ],
      }),
    );

    const respuesta = await consultar(id)
      .expect(200)
      .expect('Cache-Control', 'no-store');
    expect(obtener).toHaveBeenCalledWith(id);
    expect(respuesta.body).toEqual({
      id_cohorte: id,
      estado: 'DISPONIBLE',
      estado_agregacion: 'ACTUALIZADO',
      ultimo_timestamp_disponible: FECHA_UTC,
      motivo_sin_datos: null,
      mensaje: null,
      datos: DATOS,
    });
    expect(await snapshots(id)).toEqual([{ payload: DATOS }]);
    const bitacora = await prisma.$queryRaw<{ estado: string }[]>`
      SELECT estado_accion::text AS estado FROM administrativo.bitacora_auditoria
      WHERE accion = 'CONSULTA_AGREGADA' AND id_recurso = ${id}::uuid
        AND id_usuario_administrativo = ${admin.id}::uuid AND id_participante IS NULL
    `;
    expect(bitacora).toEqual([{ estado: 'EXITOSA' }]);
  });

  it('devuelve sin consolidar como estado funcional 200 sin crear una copia', async () => {
    const id = await crearCohorte();
    obtener.mockResolvedValueOnce({ id_cohorte: id, estado: 'PENDIENTE' });
    const respuesta = await consultar(id).expect(200);
    expect(respuesta.body).toMatchObject({
      id_cohorte: id,
      estado: 'NO_DISPONIBLE',
      estado_agregacion: 'PENDIENTE',
      motivo_sin_datos: 'SIN_CONSOLIDAR',
      ultimo_timestamp_disponible: null,
      datos: null,
    });
    expect(await snapshots(id)).toEqual([]);
  });

  it('entrega en 503 la última copia de esa cohorte y mantiene la más reciente', async () => {
    const id = await crearCohorte();
    obtener.mockResolvedValueOnce(actualizado(id));
    await consultar(id).expect(200);
    obtener.mockResolvedValueOnce(
      actualizado(id, {
        ...DATOS,
        fecha_actualizacion: '2026-11-22T06:10:00-05:00',
        tasa_adherencia_promedio: 0,
      }),
    );
    expect((await consultar(id).expect(200)).body).toMatchObject({
      datos: DATOS,
    });

    obtener.mockRejectedValueOnce(new Error('Fallo controlado de M05'));
    expect((await consultar(id).expect(503)).body).toMatchObject({
      id_cohorte: id,
      estado: 'DESACTUALIZADA',
      estado_agregacion: 'ERROR_ACTUALIZACION',
      ultimo_timestamp_disponible: FECHA_UTC,
      motivo_sin_datos: null,
      datos: DATOS,
    });
    const otra = await crearCohorte();
    expect((await consultar(otra).expect(503)).body).toMatchObject({
      id_cohorte: otra,
      estado: 'NO_DISPONIBLE',
      estado_agregacion: 'ERROR_ACTUALIZACION',
      ultimo_timestamp_disponible: null,
      motivo_sin_datos: null,
      datos: null,
    });
    const bitacora = await prisma.$queryRaw<{ total: number }[]>`
      SELECT count(*)::int AS total FROM administrativo.bitacora_auditoria
      WHERE accion = 'CONSULTA_AGREGADA' AND id_recurso = ${id}::uuid AND estado_accion = 'FALLIDA'
    `;
    expect(bitacora).toEqual([{ total: 1 }]);
  });

  it('retira la copia frente a supresión explícita y evita reexponerla en una caída', async () => {
    const id = await crearCohorte();
    obtener.mockResolvedValueOnce(actualizado(id));
    await consultar(id).expect(200);
    obtener.mockResolvedValueOnce({ id_cohorte: id, estado: 'SUPRIMIDO' });

    expect((await consultar(id).expect(200)).body).toMatchObject({
      motivo_sin_datos: 'AGREGADO_SUPRIMIDO',
      ultimo_timestamp_disponible: null,
      datos: null,
    });
    expect(await snapshots(id)).toEqual([{ payload: { estado: 'SUPRIMIDO' } }]);
    expect((await consultar(id).expect(503)).body).toMatchObject({
      estado: 'NO_DISPONIBLE',
      datos: null,
    });
  });

  it('bloquea una respuesta anterior en vuelo si después se confirmó la supresión', async () => {
    const id = await crearCohorte();
    let avisar!: () => void;
    let responder!: (resultado: ResultadoSeguimientoAgregado) => void;
    const enCurso = new Promise<void>((resolve) => {
      avisar = resolve;
    });
    const respuestaDemorada = new Promise<ResultadoSeguimientoAgregado>(
      (resolve) => {
        responder = resolve;
      },
    );
    obtener.mockImplementationOnce(() => {
      avisar();
      return respuestaDemorada;
    });

    const anterior = consultar(id).then((respuesta) => respuesta);
    await enCurso;
    try {
      obtener.mockResolvedValueOnce({ id_cohorte: id, estado: 'SUPRIMIDO' });
      await consultar(id).expect(200);
    } finally {
      responder(actualizado(id));
    }

    const resultado = await anterior;
    expect(resultado.status).toBe(200);
    expect(resultado.body).toMatchObject({
      motivo_sin_datos: 'AGREGADO_SUPRIMIDO',
      datos: null,
    });
    expect(await snapshots(id)).toEqual([{ payload: { estado: 'SUPRIMIDO' } }]);
  });

  it('responde 503 cuando M05 no contesta dentro del tiempo límite', async () => {
    const id = await crearCohorte();
    obtener.mockImplementationOnce(() => new Promise(() => {}));
    expect((await consultar(id).expect(503)).body).toMatchObject({
      estado: 'NO_DISPONIBLE',
      estado_agregacion: 'ERROR_ACTUALIZACION',
      datos: null,
    });
  });

  it('rechaza otra cohorte devuelta por M05 y una fecha inválida sin generar copias', async () => {
    const id = await crearCohorte();
    for (const resultado of [
      actualizado(randomUUID()),
      actualizado(id, {
        ...DATOS,
        fecha_actualizacion: '2026-02-30T12:00:00Z',
      }),
    ]) {
      obtener.mockResolvedValueOnce(resultado);
      expect((await consultar(id).expect(500)).body).toMatchObject({
        codigo: 'ERROR_CONSULTA_VISTA_AGREGADA',
      });
    }
    expect(await snapshots(id)).toEqual([]);
  });

  it('exige sesión administrativa y una cohorte activa, sin consultar M05 para solicitudes inválidas', async () => {
    const id = await crearCohorte('BORRADOR');
    await request(servidor()).get(ruta(id)).expect(401);
    await request(servidor())
      .get(ruta(id))
      .set('Cookie', estudiante.cookie)
      .expect(403);
    await consultar('no-es-uuid').expect(400);
    await consultar(id).expect(404);
    expect((await consultar(randomUUID()).expect(404)).body).toMatchObject({
      codigo: 'COHORTE_ACTIVA_NO_ENCONTRADA',
    });
    expect(obtener).not.toHaveBeenCalled();
  });

  it('conserva la protección del cronograma de una cohorte activa', async () => {
    const id = await crearCohorte();
    await expect(prisma.$executeRaw`
      UPDATE cronograma.cronogramas SET estado = 'INACTIVO', fecha_activacion = NULL
      WHERE id_cronograma = ${cronograma}::uuid
    `).rejects.toThrow('CRONOGRAMA_CON_COHORTE_ACTIVA');
    obtener.mockResolvedValueOnce(actualizado(id));
    await consultar(id).expect(200);
    expect(obtener).toHaveBeenCalledWith(id);
  });

  it('revierte el snapshot si no se puede guardar la auditoría de la consulta', async () => {
    const id = await crearCohorte();
    obtener.mockResolvedValueOnce(actualizado(id));
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION administrativo.fn_prueba_fallar_rf132() RETURNS trigger
      LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Fallo controlado de auditoría RF-132'; END $$
    `;
    await prisma.$executeRaw`
      CREATE TRIGGER trg_prueba_fallar_rf132 BEFORE INSERT ON administrativo.bitacora_auditoria
      FOR EACH ROW WHEN (NEW.accion = 'CONSULTA_AGREGADA' AND NEW.estado_accion = 'EXITOSA')
      EXECUTE FUNCTION administrativo.fn_prueba_fallar_rf132()
    `;
    try {
      expect((await consultar(id).expect(500)).body).toMatchObject({
        codigo: 'ERROR_REGISTRO_AUDITORIA',
      });
      expect(await snapshots(id)).toEqual([]);
    } finally {
      await prisma.$executeRaw`DROP TRIGGER trg_prueba_fallar_rf132 ON administrativo.bitacora_auditoria`;
      await prisma.$executeRaw`DROP FUNCTION administrativo.fn_prueba_fallar_rf132()`;
    }
  });

  describe('RF-133 y RF-134 con fuentes independientes', () => {
    const fecha = '2026-11-15T00:00:00-05:00';
    const narrativa = {
      total_usuarios_cohorte: 45,
      distribucion_por_fase_narrativa: [
        { fase: 'INICIO', total: 12 },
        { fase: 'DESARROLLO', total: 24 },
        { fase: 'CIERRE', total: 6 },
      ],
      total_usuarios_programa_completado: 3,
      total_usuarios_con_logros: 31,
      total_logros_desbloqueados: 87,
      fecha_actualizacion: fecha,
    };
    const notificaciones = {
      tasa_apertura_promedio: 0.612345678,
      tasa_conversion_promedio: 0.34,
      total_notificaciones_enviadas: 1260,
      total_notificaciones_entregadas: 1198,
      total_notificaciones_descartadas: 62,
      fecha_actualizacion: fecha,
    };

    const rutaVista = (id: string, vista: 'narrativa' | 'notificaciones') =>
      `${base}/${id}/vistas/${vista}`;
    const consultarVista = (
      id: string,
      vista: 'narrativa' | 'notificaciones',
    ) =>
      request(servidor()).get(rutaVista(id, vista)).set('Cookie', admin.cookie);

    afterEach(() => {
      obtenerNarrativa.mockReset();
      obtenerNotificaciones.mockReset();
    });

    it('narrativa conserva el agregado de RF-117 sin computar a los excluidos ni exponer sus datos', async () => {
      const id = await crearCohorte();
      obtenerNarrativa.mockResolvedValueOnce(
        actualizado(id, {
          ...narrativa,
          perfiles_excluidos: [{ id_usuario: randomUUID() }],
          distribucion_por_fase_narrativa: [
            {
              ...narrativa.distribucion_por_fase_narrativa[0],
              capitulo_activo: 'Privado',
            },
            ...narrativa.distribucion_por_fase_narrativa.slice(1),
          ],
        }),
      );

      const respuesta = await consultarVista(id, 'narrativa')
        .expect(200)
        .expect('Cache-Control', 'no-store');
      expect(respuesta.body).toEqual({
        id_cohorte: id,
        estado: 'DISPONIBLE',
        estado_agregacion: 'ACTUALIZADO',
        ultimo_timestamp_disponible: '2026-11-15T05:00:00.000Z',
        motivo_sin_datos: null,
        mensaje: null,
        datos: narrativa,
      });
      expect(obtenerNarrativa).toHaveBeenCalledWith(id);
      expect(obtenerNotificaciones).not.toHaveBeenCalled();
    });

    it('notificaciones conserva la precisión de RF-101 sin exponer métricas individuales', async () => {
      const id = await crearCohorte();
      obtenerNotificaciones.mockResolvedValueOnce(
        actualizado(id, {
          ...notificaciones,
          metricas_por_usuario: [{ id_usuario: randomUUID(), tasa: null }],
          mensaje: 'Contenido privado',
        }),
      );
      const respuesta = await consultarVista(id, 'notificaciones').expect(200);
      expect(respuesta.body).toMatchObject({
        id_cohorte: id,
        estado: 'DISPONIBLE',
        estado_agregacion: 'ACTUALIZADO',
        ultimo_timestamp_disponible: '2026-11-15T05:00:00.000Z',
      });
      expect(respuesta.body).toHaveProperty('datos', notificaciones);
      expect(obtenerNotificaciones).toHaveBeenCalledWith(id);
      expect(obtenerNarrativa).not.toHaveBeenCalled();
    });

    it('notificaciones distingue cero envíos consolidado de una cohorte pendiente', async () => {
      const id = await crearCohorte();
      const sinEnvios = {
        ...notificaciones,
        tasa_apertura_promedio: null,
        tasa_conversion_promedio: null,
        total_notificaciones_enviadas: 0,
        total_notificaciones_entregadas: 0,
        total_notificaciones_descartadas: 0,
      };
      obtenerNotificaciones
        .mockResolvedValueOnce(actualizado(id, sinEnvios))
        .mockResolvedValueOnce({ id_cohorte: id, estado: 'PENDIENTE' });
      const disponible = await consultarVista(id, 'notificaciones').expect(200);
      expect(disponible.body).toMatchObject({
        estado: 'DISPONIBLE',
        estado_agregacion: 'ACTUALIZADO',
        datos: sinEnvios,
      });
      const pendiente = await consultarVista(id, 'notificaciones').expect(200);
      expect(pendiente.body).toEqual({
        id_cohorte: id,
        estado: 'DISPONIBLE',
        estado_agregacion: 'PENDIENTE',
        ultimo_timestamp_disponible: null,
        motivo_sin_datos: 'SIN_CONSOLIDAR',
        mensaje:
          'La cohorte activa no cuenta todavía con métricas de efectividad de notificaciones consolidadas.',
        datos: null,
      });
    });

    it('narrativa sin perfiles consolidados devuelve un estado funcional', async () => {
      const id = await crearCohorte();
      obtenerNarrativa.mockResolvedValueOnce({
        id_cohorte: id,
        estado: 'PENDIENTE',
      });
      const respuesta = await consultarVista(id, 'narrativa').expect(200);
      expect(respuesta.body).toMatchObject({
        id_cohorte: id,
        estado: 'NO_DISPONIBLE',
        estado_agregacion: 'PENDIENTE',
        ultimo_timestamp_disponible: null,
        motivo_sin_datos: 'SIN_CONSOLIDAR',
        datos: null,
      });
    });

    it('aísla las caídas y las copias de cada vista para una misma cohorte', async () => {
      const id = await crearCohorte();
      obtenerNarrativa.mockResolvedValueOnce(actualizado(id, narrativa));
      await consultarVista(id, 'narrativa').expect(200);
      obtenerNotificaciones.mockResolvedValueOnce({
        id_cohorte: id,
        estado: 'NO_DISPONIBLE',
      });
      expect(
        (await consultarVista(id, 'notificaciones').expect(503)).body,
      ).toMatchObject({
        id_cohorte: id,
        estado: 'NO_DISPONIBLE',
        estado_agregacion: 'ERROR_ACTUALIZACION',
        datos: null,
      });

      obtenerNarrativa.mockRejectedValueOnce(new Error('M06 de prueba'));
      obtenerNotificaciones.mockResolvedValueOnce(
        actualizado(id, notificaciones),
      );
      const [desactualizada, disponible] = await Promise.all([
        consultarVista(id, 'narrativa').expect(503),
        consultarVista(id, 'notificaciones').expect(200),
      ]);
      expect(desactualizada.body).toMatchObject({
        estado: 'DESACTUALIZADA',
        ultimo_timestamp_disponible: '2026-11-15T05:00:00.000Z',
        datos: narrativa,
      });
      expect(disponible.body).toMatchObject({
        estado: 'DISPONIBLE',
        datos: notificaciones,
      });

      obtenerNarrativa.mockResolvedValueOnce(actualizado(id, narrativa));
      obtenerNotificaciones.mockRejectedValueOnce(new Error('M07 de prueba'));
      const [nueva, respaldo] = await Promise.all([
        consultarVista(id, 'narrativa').expect(200),
        consultarVista(id, 'notificaciones').expect(503),
      ]);
      expect(nueva.body).toMatchObject({
        estado: 'DISPONIBLE',
        datos: narrativa,
      });
      expect(respaldo.body).toMatchObject({
        estado: 'DESACTUALIZADA',
        datos: notificaciones,
      });
      expect(
        await prisma.$queryRaw<{ recurso_afectado: string }[]>`
        SELECT DISTINCT recurso_afectado FROM administrativo.bitacora_auditoria
        WHERE id_recurso = ${id}::uuid AND accion = 'CONSULTA_AGREGADA'
          AND estado_accion = 'EXITOSA'
        ORDER BY recurso_afectado
      `,
      ).toEqual([
        { recurso_afectado: 'VISTA_AGREGADA_NARRATIVA' },
        { recurso_afectado: 'VISTA_AGREGADA_NOTIFICACIONES' },
      ]);
    });

    it('bloquea la entrega del respaldo si falla la auditoría', async () => {
      const id = await crearCohorte();
      obtenerNarrativa.mockResolvedValueOnce(actualizado(id, narrativa));
      await consultarVista(id, 'narrativa').expect(200);

      await prisma.$executeRaw`
          CREATE FUNCTION administrativo.fn_prueba_fallar_respaldo_rf133() RETURNS trigger
          LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Fallo de auditoría RF-133'; END $$
        `;
      await prisma.$executeRaw`
          CREATE TRIGGER trg_prueba_fallar_respaldo_rf133
          BEFORE INSERT ON administrativo.bitacora_auditoria FOR EACH ROW
          WHEN (NEW.recurso_afectado = 'VISTA_AGREGADA_NARRATIVA' AND NEW.estado_accion = 'FALLIDA')
          EXECUTE FUNCTION administrativo.fn_prueba_fallar_respaldo_rf133()
        `;
      try {
        obtenerNarrativa.mockRejectedValueOnce(new Error('M06 de prueba'));
        const respuesta = await consultarVista(id, 'narrativa').expect(500);
        expect(respuesta.body).toMatchObject({
          codigo: 'ERROR_REGISTRO_AUDITORIA',
        });
        expect(respuesta.body).not.toHaveProperty('datos');
      } finally {
        await prisma.$executeRaw`DROP TRIGGER trg_prueba_fallar_respaldo_rf133 ON administrativo.bitacora_auditoria`;
        await prisma.$executeRaw`DROP FUNCTION administrativo.fn_prueba_fallar_respaldo_rf133()`;
      }
    });

    it.each(['narrativa', 'notificaciones'] as const)(
      'protege la consulta de %s y rechaza resultados de otra cohorte',
      async (vista) => {
        const id = await crearCohorte();
        const ruta = rutaVista(id, vista);
        const fuente =
          vista === 'narrativa' ? obtenerNarrativa : obtenerNotificaciones;
        await request(servidor()).get(ruta).expect(401);
        await request(servidor())
          .get(ruta)
          .set('Cookie', estudiante.cookie)
          .expect(403);
        await consultarVista('uuid-invalido', vista).expect(400);
        await consultarVista(await crearCohorte('BORRADOR'), vista).expect(404);
        expect(fuente).not.toHaveBeenCalled();

        fuente.mockResolvedValueOnce(actualizado(randomUUID(), narrativa));
        const error = await consultarVista(id, vista).expect(500);
        expect(error.body).toMatchObject({
          codigo: 'ERROR_CONSULTA_VISTA_AGREGADA',
        });
        expect(error.body).not.toHaveProperty('datos');
        expect(
          await prisma.$queryRaw`
          SELECT vista FROM administrativo.snapshots_vista WHERE id_cohorte = ${id}::uuid
        `,
        ).toEqual([]);
      },
    );
  });
});
