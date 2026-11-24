import { INestApplication, ValidationPipe } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { createHash, randomUUID } from 'node:crypto';
import request from 'supertest';
import { PrismaService } from '../../prisma/prisma.service';
import { AdministrativoModule } from '../../src/modules/administrativo/administrativo.module';
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

conPostgres('RF-132 vista conductual con PostgreSQL y M05 simulado', () => {
  jest.setTimeout(60_000);
  let app: INestApplication;
  let prisma: PrismaService;
  let admin: { id: string; cookie: string };
  let estudiante: typeof admin;
  const cronograma = randomUUID();
  const envAnterior = process.env.DATABASE_URL;
  const obtener = jest.fn<Promise<ResultadoSeguimientoAgregado>, [string]>();

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
});
