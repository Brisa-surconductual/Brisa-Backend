import { INestApplication, ValidationPipe } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { createHash, randomUUID } from 'node:crypto';
import request from 'supertest';
import { PrismaService } from '../../prisma/prisma.service';
import { AdministrativoModule } from '../../src/modules/administrativo/administrativo.module';
import type { Cohorte } from '../../src/modules/administrativo/domain/cohorte';
import { PrismaCohortesRepository } from '../../src/modules/administrativo/infrastructure/persistence/prisma-cohortes.repository';
import { SessionCookieConfig } from '../../src/modules/usuarios/application/ports/session-cookie-config';

const urlLocal = process.env.RF124_TEST_DATABASE_URL;
const conPostgres = urlLocal ? describe : describe.skip;
const ruta = '/admin/cohortes';

async function crearActor(
  prisma: PrismaService,
  rol: 'ADMINISTRATIVO' | 'ESTUDIANTE',
  alcance: 'COMPLETA' | 'LIMITADA' = 'COMPLETA',
) {
  const idUsuario = randomUUID();
  const idSesion = randomUUID();
  const token = randomUUID();
  const csrf = randomUUID();
  const hash = (valor: string) =>
    createHash('sha256').update(valor).digest('hex');
  const consentimiento = rol === 'ESTUDIANTE' ? randomUUID() : null;
  if (consentimiento) {
    await prisma.$executeRaw`
      INSERT INTO usuario.consentimientos
        (id_consentimiento, version_consentimiento, vigente, fecha_invalidacion,
         motivo_invalidacion, url_contenido, titulo)
      VALUES (${consentimiento}::uuid, ${consentimiento.slice(0, 18)}, false, now(),
        'Prueba RF-124', 'https://example.invalid/consentimiento', 'Consentimiento RF-124')
    `;
  }
  await prisma.$executeRaw`
    INSERT INTO usuario.usuarios
      (id_usuario, correo_electronico, contrasena_hash, rol, estado_registro,
       consentimiento_aceptado, registro_consumo_aceptado, id_consentimiento)
    VALUES (${idUsuario}::uuid, ${idUsuario + '@example.invalid'}, ${randomUUID()},
      ${rol}::usuario.rol_enum, 'REGISTRO_COMPLETO', true, true, ${consentimiento}::uuid)
  `;
  await prisma.$executeRaw`
    INSERT INTO usuario.sesiones (id_sesion, id_usuario, token_hash, csrf_token_hash, alcance_sesion)
    VALUES (${idSesion}::uuid, ${idUsuario}::uuid, ${hash(token)}, ${hash(csrf)},
      ${alcance}::usuario.alcance_sesion_enum)
  `;
  return { idUsuario, idSesion, token, csrf };
}

type Actor = Awaited<ReturnType<typeof crearActor>>;

conPostgres('RF-124 gestión de cohortes con PostgreSQL y sesión real', () => {
  jest.setTimeout(60_000);
  let app: INestApplication;
  let prisma: PrismaService;
  let admin: Actor;
  let estudiante: Actor;
  let limitada: Actor;
  let cookie: string;
  const activo = randomUUID();
  const inactivo = randomUUID();
  const envAnterior = process.env.DATABASE_URL;

  async function cronograma(id: string, estado: 'ACTIVO' | 'INACTIVO') {
    await prisma.$executeRaw`
      INSERT INTO cronograma.cronogramas (id_cronograma, nombre_cronograma, estado, fecha_activacion)
      VALUES (${id}::uuid, 'Cronograma RF-124', ${estado}::cronograma.estado_cronograma_enum,
        CASE WHEN ${estado} = 'ACTIVO' THEN now() ELSE NULL END)
    `;
  }

  beforeAll(async () => {
    const url = new URL(urlLocal ?? '');
    if (
      url.hostname !== '127.0.0.1' ||
      !/^\/brisa_rf124_[a-z0-9_]+$/u.test(url.pathname)
    ) {
      throw new Error(
        'RF-124 requiere una base desechable brisa_rf124_* en localhost.',
      );
    }
    process.env.DATABASE_URL = url.toString();
    const modulo = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot({ global: true }),
        AdministrativoModule,
      ],
    }).compile();
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
    cookie = app.get(SessionCookieConfig).obtenerNombreCookie();
    admin = await crearActor(prisma, 'ADMINISTRATIVO');
    estudiante = await crearActor(prisma, 'ESTUDIANTE');
    limitada = await crearActor(prisma, 'ADMINISTRATIVO', 'LIMITADA');
    await cronograma(activo, 'ACTIVO');
    await cronograma(inactivo, 'INACTIVO');
  });

  afterAll(async () => {
    await app?.close();
    if (envAnterior === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = envAnterior;
  });

  const datosValidos = (idCronograma = activo) => ({
    nombre_cohorte: '  Cohorte RF-124  ',
    fecha_inicio_programa: '2026-11-23',
    fecha_fin_programa: '2026-11-23',
    id_cronograma: idCronograma,
  });

  const servidor = () => app.getHttpServer() as Parameters<typeof request>[0];

  function crear(
    body: object,
    actor: Actor = admin,
    csrf: string = actor.csrf,
  ) {
    return request(servidor())
      .post(ruta)
      .set('Cookie', `${cookie}=${actor.token}`)
      .set('X-CSRF-Token', csrf)
      .send(body);
  }

  function actualizar(id: string, body: object) {
    return request(servidor())
      .patch(`${ruta}/${id}`)
      .set('Cookie', `${cookie}=${admin.token}`)
      .set('X-CSRF-Token', admin.csrf)
      .send(body);
  }

  async function crearBorrador(idCronograma = activo) {
    const respuesta = await crear({
      ...datosValidos(idCronograma),
      nombre_cohorte: 'Cohorte RF-124 ' + randomUUID(),
    }).expect(201);
    return respuesta.body as Cohorte;
  }

  it('crea BORRADOR, edita parcialmente y activa, inactiva y reactiva con trazabilidad', async () => {
    const solicitud = {
      ...datosValidos(),
      nombre_cohorte: `  Cohorte RF-124 ${randomUUID()}  `,
    };
    const respuesta = await crear(solicitud).expect(201);
    const creada = respuesta.body as Cohorte;
    expect(creada).toEqual({
      ...datosValidos(),
      id_cohorte: expect.any(String) as unknown,
      nombre_cohorte: solicitud.nombre_cohorte.trim(),
      estado: 'BORRADOR',
      fecha_actualizacion: expect.any(String) as unknown,
    });
    expect(Number.isNaN(Date.parse(creada.fecha_actualizacion))).toBe(false);

    const nombreEditado = 'Cohorte editada ' + randomUUID();
    const editar = await actualizar(creada.id_cohorte, {
      nombre_cohorte: nombreEditado,
    }).expect(200);
    expect(editar.body).toMatchObject({
      ...datosValidos(),
      nombre_cohorte: nombreEditado,
      estado: 'BORRADOR',
    });
    const activar = await actualizar(creada.id_cohorte, {
      estado: 'ACTIVA',
    }).expect(200);
    expect(activar.body).toMatchObject({ estado: 'ACTIVA' });
    await actualizar(creada.id_cohorte, { estado: 'INACTIVA' }).expect(200);
    await actualizar(creada.id_cohorte, { estado: 'ACTIVA' }).expect(200);

    const auditoria = await prisma.$queryRaw<{ operacion: string }[]>`
      SELECT detalle->>'operacion' AS operacion FROM administrativo.bitacora_auditoria
      WHERE id_recurso = ${creada.id_cohorte}::uuid AND accion = 'GESTION_COHORTE'
        AND estado_accion = 'EXITOSA' AND registrado_diferido = false
        AND id_usuario_administrativo = ${admin.idUsuario}::uuid AND id_sesion = ${admin.idSesion}::uuid
    `;
    expect(auditoria.map(({ operacion }) => operacion).sort()).toEqual([
      'ACTIVAR',
      'ACTIVAR',
      'CREAR',
      'EDITAR',
      'INACTIVAR',
    ]);
    const [cohorte] = await prisma.$queryRaw<
      {
        creado_por: string;
        actualizado_por: string;
        fecha_activacion: Date;
        fecha_inactivacion: Date | null;
      }[]
    >`
      SELECT creado_por, actualizado_por, fecha_activacion, fecha_inactivacion
      FROM administrativo.cohortes WHERE id_cohorte = ${creada.id_cohorte}::uuid
    `;
    expect(cohorte).toEqual({
      creado_por: admin.idUsuario,
      actualizado_por: admin.idUsuario,
      fecha_activacion: expect.any(Date) as unknown,
      fecha_inactivacion: null,
    });
  });

  it('verifica campos obligatorios, fechas de calendario y parámetros de PATCH', async () => {
    await crear({}).expect(400);
    await crear({ ...datosValidos(), nombre_cohorte: '  ' }).expect(400);
    await crear({ ...datosValidos(), fecha_fin_programa: '2026-02-30' }).expect(
      400,
    );
    await crear({ ...datosValidos(), estado: 'ACTIVA' }).expect(400);
    await crear({ ...datosValidos(), fecha_fin_programa: '2026-11-22' })
      .expect(400)
      .expect(({ body }) => {
        expect(body).toMatchObject({ codigo: 'FECHAS_COHORTE_INVALIDAS' });
      });

    const { id_cohorte } = await crearBorrador();
    await actualizar(id_cohorte, { fecha_fin_programa: null }).expect(400);
    await actualizar(id_cohorte, {}).expect(400);
    await actualizar(id_cohorte, {
      fecha_inicio_programa: '2026-11-24',
    }).expect(400);
    await actualizar('invalido', { estado: 'ACTIVA' }).expect(400);
    await actualizar(randomUUID(), { estado: 'ACTIVA' }).expect(404);
  });

  it('exige cronograma activo al crear, editar o activar', async () => {
    await crear(datosValidos(randomUUID()))
      .expect(404)
      .expect(({ body }) => {
        expect(body).toMatchObject({ codigo: 'CRONOGRAMA_NO_ENCONTRADO' });
      });
    await crear(datosValidos(inactivo))
      .expect(422)
      .expect(({ body }) => {
        expect(body).toMatchObject({ codigo: 'CRONOGRAMA_NO_ACTIVO' });
      });

    const cronogramaRetirado = randomUUID();
    await cronograma(cronogramaRetirado, 'ACTIVO');
    const { id_cohorte } = await crearBorrador(cronogramaRetirado);
    await prisma.$executeRaw`
      UPDATE cronograma.cronogramas SET estado = 'INACTIVO', fecha_activacion = NULL
      WHERE id_cronograma = ${cronogramaRetirado}::uuid
    `;
    await actualizar(id_cohorte, { estado: 'ACTIVA' }).expect(422);
    await actualizar(id_cohorte, { nombre_cohorte: 'Otra cohorte' }).expect(
      422,
    );
    await actualizar(id_cohorte, { id_cronograma: randomUUID() }).expect(404);
    await actualizar(id_cohorte, {
      id_cronograma: activo,
      estado: 'ACTIVA',
    }).expect(200);
  });

  it('valida sesión, alcance, rol y token CSRF', async () => {
    await request(servidor()).post(ruta).send(datosValidos()).expect(401);
    await crear(datosValidos(), estudiante).expect(403);
    await crear(datosValidos(), limitada).expect(403);
    await crear(datosValidos(), admin, 'invalido').expect(403);
  });

  it('lista y consulta con sesión administrativa, e ignora cohortes eliminadas', async () => {
    const vigente = await crearBorrador();
    const eliminada = await crearBorrador();
    await prisma.$executeRaw`
      UPDATE administrativo.cohortes SET fecha_eliminacion = now()
      WHERE id_cohorte = ${eliminada.id_cohorte}::uuid
    `;

    const cookieAdmin = `${cookie}=${admin.token}`;
    const esperado = { ...vigente, nombre_cronograma: 'Cronograma RF-124' };
    const listado = await request(servidor())
      .get(ruta)
      .set('Cookie', cookieAdmin)
      .expect('Cache-Control', 'no-store')
      .expect(200);
    expect(listado.body).toContainEqual(esperado);
    expect(listado.body).not.toContainEqual(
      expect.objectContaining({ id_cohorte: eliminada.id_cohorte }),
    );
    await request(servidor())
      .get(`${ruta}/${vigente.id_cohorte}`)
      .set('Cookie', cookieAdmin)
      .expect(200)
      .expect(esperado);
    await request(servidor())
      .get(`${ruta}/${eliminada.id_cohorte}`)
      .set('Cookie', cookieAdmin)
      .expect(404);
    await request(servidor()).get(ruta).expect(401);
    await request(servidor())
      .get(ruta)
      .set('Cookie', `${cookie}=${estudiante.token}`)
      .expect(403);

    await expect(prisma.$queryRaw`
      SELECT recurso_afectado FROM administrativo.bitacora_auditoria
      WHERE id_recurso = ${vigente.id_cohorte}::uuid
        AND accion = 'ACCESO_MODULO' AND estado_accion = 'EXITOSA'
    `).resolves.toEqual([{ recurso_afectado: 'COHORTE' }]);
  });

  it('traduce un nombre duplicado al crear y al editar', async () => {
    const primera = await crearBorrador();
    const segunda = await crearBorrador();
    const { nombre_cohorte } = primera;
    const duplicada = { codigo: 'NOMBRE_COHORTE_DUPLICADO' };
    await crear({ ...datosValidos(), nombre_cohorte })
      .expect(409)
      .expect(({ body }) => {
        expect(body).toMatchObject(duplicada);
      });
    await actualizar(segunda.id_cohorte, { nombre_cohorte })
      .expect(409)
      .expect(({ body }) => {
        expect(body).toMatchObject(duplicada);
      });
  });

  it('serializa activaciones simultáneas y rechaza la transición repetida', async () => {
    const { id_cohorte } = await crearBorrador();
    await actualizar(id_cohorte, { estado: 'INACTIVA' }).expect(409);
    const resultados = await Promise.all([
      actualizar(id_cohorte, { estado: 'ACTIVA' }),
      actualizar(id_cohorte, { estado: 'ACTIVA' }),
    ]);
    expect(resultados.map(({ status }) => status).sort()).toEqual([200, 409]);
    expect(resultados.find(({ status }) => status === 409)?.body).toMatchObject(
      {
        codigo: 'TRANSICION_COHORTE_INVALIDA',
      },
    );
    await actualizar(id_cohorte, { estado: 'BORRADOR' }).expect(409);
  });

  it('traduce los tokens de los triggers y CHECK de PostgreSQL', async () => {
    const repo = new PrismaCohortesRepository();
    const crearDirecto = (
      datos: ReturnType<typeof datosValidos>,
      actor: Actor = admin,
    ) =>
      prisma.$transaction((tx) =>
        repo.crear(tx, randomUUID(), datos, actor.idUsuario),
      );
    for (const [datos, status, codigo, actor] of [
      [datosValidos(randomUUID()), 404, 'CRONOGRAMA_NO_ENCONTRADO', admin],
      [datosValidos(inactivo), 422, 'CRONOGRAMA_NO_ACTIVO', admin],
      [
        { ...datosValidos(), fecha_fin_programa: '2026-11-22' },
        400,
        'FECHAS_COHORTE_INVALIDAS',
        admin,
      ],
      [
        { ...datosValidos(), nombre_cohorte: ' ' },
        400,
        'NOMBRE_COHORTE_INVALIDO',
        admin,
      ],
      [datosValidos(), 403, 'ROL_INVALIDO', estudiante],
    ] as const) {
      await expect(crearDirecto(datos, actor)).rejects.toMatchObject({
        status,
        response: { codigo },
      });
    }
    const cohorte = await crearBorrador();
    await expect(
      prisma.$transaction((tx) =>
        repo.actualizar(
          tx,
          { ...cohorte, estado: 'INACTIVA' },
          admin.idUsuario,
        ),
      ),
    ).rejects.toMatchObject({
      status: 409,
      response: { codigo: 'TRANSICION_COHORTE_INVALIDA' },
    });
  });

  it('revierte la escritura de cohorte si falla la auditoría síncrona', async () => {
    const cohorte = await crearBorrador();
    await prisma.$executeRaw`
      CREATE FUNCTION administrativo.fn_prueba_fallo_rf124() RETURNS trigger
      LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Fallo controlado RF-124'; END $$
    `;
    await prisma.$executeRaw`
      CREATE TRIGGER trg_prueba_fallo_rf124 BEFORE INSERT ON administrativo.bitacora_auditoria
      FOR EACH ROW WHEN (NEW.accion = 'GESTION_COHORTE' AND NEW.estado_accion = 'EXITOSA')
      EXECUTE FUNCTION administrativo.fn_prueba_fallo_rf124()
    `;
    try {
      await actualizar(cohorte.id_cohorte, { estado: 'ACTIVA' })
        .expect(500)
        .expect(({ body }) => {
          expect(body).toMatchObject({ codigo: 'ERROR_REGISTRO_AUDITORIA' });
        });
      const filas = await prisma.$queryRaw`
        SELECT estado::text FROM administrativo.cohortes WHERE id_cohorte = ${cohorte.id_cohorte}::uuid
      `;
      expect(filas).toEqual([{ estado: 'BORRADOR' }]);
      const nombre = 'Cohorte fallida ' + randomUUID();
      await crear({ ...datosValidos(), nombre_cohorte: nombre }).expect(500);
      await expect(prisma.$queryRaw`
        SELECT id_cohorte FROM administrativo.cohortes WHERE nombre_cohorte = ${nombre}
      `).resolves.toEqual([]);
    } finally {
      await prisma.$executeRaw`DROP TRIGGER trg_prueba_fallo_rf124 ON administrativo.bitacora_auditoria`;
      await prisma.$executeRaw`DROP FUNCTION administrativo.fn_prueba_fallo_rf124()`;
    }
  });
});
