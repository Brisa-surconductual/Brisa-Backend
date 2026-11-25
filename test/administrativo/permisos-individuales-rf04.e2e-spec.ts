import { INestApplication, ValidationPipe } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { createHash, randomUUID } from 'node:crypto';
import request from 'supertest';
import { PrismaService } from '../../prisma/prisma.service';
import { AdministrativoModule } from '../../src/modules/administrativo/administrativo.module';
import { ChatModule } from '../../src/modules/chat/chat.module';
import { SessionCookieConfig } from '../../src/modules/usuarios/application/ports/session-cookie-config';
import { SessionTokenHasher } from '../../src/modules/usuarios/application/ports/session-token-hasher';

const urlLocal = process.env.RF04_TEST_DATABASE_URL;
const conPostgres = urlLocal ? describe : describe.skip;
const base = '/admin/permisos-individuales';

type Actor = { id: string; cookie: string; csrf: string };

conPostgres('RF-04 permisos individuales con PostgreSQL y sesión real', () => {
  jest.setTimeout(60_000);
  let app: INestApplication;
  let prisma: PrismaService;
  let coordinador: Actor;
  let otroCoordinador: Actor;
  let admin: Actor;
  const envAnterior = process.env.DATABASE_URL;

  async function crearActor(
    rol: 'ADMINISTRATIVO' | 'COORDINADOR_PSI' | 'ESTUDIANTE',
  ): Promise<Actor> {
    const id = randomUUID();
    const token = randomUUID();
    const csrf = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO usuario.usuarios (id_usuario, correo_electronico, contrasena_hash, rol, estado_registro,
        consentimiento_aceptado, registro_consumo_aceptado)
      VALUES (${id}::uuid, ${id + '@example.invalid'}, ${randomUUID()}, ${rol}::usuario.rol_enum,
        'REGISTRO_COMPLETO', true, true)
    `;
    const csrfHash = await app.get(SessionTokenHasher).hash(csrf);
    const hash = createHash('sha256').update(token).digest('hex');
    await prisma.$executeRaw`
      INSERT INTO usuario.sesiones (id_usuario, token_hash, csrf_token_hash, alcance_sesion)
      VALUES (${id}::uuid, ${hash}, ${csrfHash}, 'COMPLETA')
    `;
    const nombre = app.get(SessionCookieConfig).obtenerNombreCookie();
    return { id, cookie: `${nombre}=${token}`, csrf };
  }

  async function crearParticipante() {
    const { id } = await crearActor('ESTUDIANTE');
    const [fila] = await prisma.$queryRaw<{ codigo: string }[]>`
      SELECT administrativo.fn_obtener_codigo_participante(${id}::uuid) AS codigo
    `;
    return { id, codigo: fila.codigo };
  }

  const servidor = () => app.getHttpServer() as Parameters<typeof request>[0];
  const otorgar = (actor: Actor, body: object) =>
    request(servidor())
      .post(base)
      .set('Cookie', actor.cookie)
      .set('X-CSRF-Token', actor.csrf)
      .send(body);
  const revocar = (actor: Actor, id: string) =>
    request(servidor())
      .post(`${base}/${id}/revocar`)
      .set('Cookie', actor.cookie)
      .set('X-CSRF-Token', actor.csrf);
  const listar = (actor: Actor, query = '') =>
    request(servidor()).get(`${base}${query}`).set('Cookie', actor.cookie);
  const sesionesChat = (actor: Actor, codigo: string) =>
    request(servidor())
      .get(`/chat/admin/participantes/${codigo}/sesiones`)
      .set('Cookie', actor.cookie);

  beforeAll(async () => {
    const url = new URL(urlLocal ?? '');
    if (
      url.hostname !== '127.0.0.1' ||
      !/^\/brisa_rf04_[a-z0-9_]+$/u.test(url.pathname)
    ) {
      throw new Error(
        'RF-04 requiere una base desechable brisa_rf04_* en localhost.',
      );
    }
    process.env.DATABASE_URL = url.toString();
    const modulo = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot({ global: true }),
        AdministrativoModule,
        ChatModule,
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
    coordinador = await crearActor('COORDINADOR_PSI');
    otroCoordinador = await crearActor('COORDINADOR_PSI');
    admin = await crearActor('ADMINISTRATIVO');
  });

  afterAll(async () => {
    await app?.close();
    if (envAnterior === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = envAnterior;
  });

  it('otorga, lista, revoca y audita con severidad ALTA en la misma transacción', async () => {
    const participante = await crearParticipante();
    const creado = await otorgar(coordinador, {
      codigo_participante: participante.codigo,
      alcance: 'ACCESO_INDIVIDUAL',
      fecha_fin_vigencia: '2099-12-31T23:59:59Z',
      id_usuario_beneficiario: admin.id,
    }).expect(201);
    const permiso = creado.body as { id_permiso: string; vigente: boolean };
    expect(creado.body).toMatchObject({
      codigo_participante: participante.codigo,
      alcance: 'ACCESO_INDIVIDUAL',
      fecha_fin_vigencia: '2099-12-31T23:59:59.000Z',
      vigente: true,
    });

    const listado = await listar(
      coordinador,
      `?codigo_participante=${participante.codigo}&solo_vigentes=true`,
    ).expect(200);
    expect(listado.body).toMatchObject({ total: 1, offset: 0, limit: 20 });
    const items = (listado.body as { items: unknown[] }).items;
    expect(items[0]).toMatchObject({
      id_permiso: permiso.id_permiso,
      vigente: true,
    });

    const revocado = await revocar(coordinador, permiso.id_permiso).expect(200);
    expect(revocado.body).toMatchObject({
      id_permiso: permiso.id_permiso,
      vigente: false,
    });
    await revocar(coordinador, permiso.id_permiso)
      .expect(409)
      .expect(({ body }) =>
        expect(body).toMatchObject({ codigo: 'PERMISO_YA_REVOCADO' }),
      );

    const bitacora = await prisma.$queryRaw<
      { severidad: string; operacion: string }[]
    >`
      SELECT severidad::text, detalle->>'operacion' AS operacion
      FROM administrativo.bitacora_auditoria
      WHERE id_recurso = ${permiso.id_permiso}::uuid AND accion = 'GESTION_PERMISO_INDIVIDUAL'
        AND estado_accion = 'EXITOSA'
      ORDER BY marca_temporal
    `;
    expect(bitacora).toEqual([
      { severidad: 'ALTA', operacion: 'OTORGAR' },
      { severidad: 'ALTA', operacion: 'REVOCAR' },
    ]);
  });

  it('aplica los errores del contrato', async () => {
    const participante = await crearParticipante();
    const cuerpo = {
      codigo_participante: participante.codigo,
      alcance: 'ACCESO_INDIVIDUAL',
      id_usuario_beneficiario: admin.id,
    };
    await otorgar(coordinador, cuerpo).expect(201);
    await otorgar(otroCoordinador, cuerpo)
      .expect(409)
      .expect(({ body }) =>
        expect(body).toEqual({
          status: 409,
          codigo: 'PERMISO_YA_VIGENTE',
          mensaje: 'Ya existe un permiso vigente con ese alcance.',
        }),
      );
    await otorgar(coordinador, { ...cuerpo, codigo_participante: 'P-00000000' })
      .expect(404)
      .expect(({ body }) =>
        expect(body).toMatchObject({ codigo: 'PARTICIPANTE_NO_ENCONTRADO' }),
      );
    await otorgar(coordinador, {
      ...cuerpo,
      id_usuario_beneficiario: coordinador.id,
    })
      .expect(422)
      .expect(({ body }) =>
        expect(body).toMatchObject({ codigo: 'AUTOCONCESION_NO_PERMITIDA' }),
      );
    await otorgar(coordinador, {
      ...cuerpo,
      id_usuario_beneficiario: otroCoordinador.id,
    })
      .expect(422)
      .expect(({ body }) =>
        expect(body).toMatchObject({ codigo: 'ROL_INVALIDO_PARA_OPERACION' }),
      );
    await revocar(coordinador, randomUUID())
      .expect(404)
      .expect(({ body }) =>
        expect(body).toMatchObject({ codigo: 'PERMISO_NO_ENCONTRADO' }),
      );
  });

  it('es exclusivo de COORDINADOR_PSI', async () => {
    await listar(admin).expect(403);
  });

  it('el guard exige permiso vigente al ADMINISTRATIVO y no al COORDINADOR_PSI', async () => {
    const participante = await crearParticipante();
    const sinPermiso = await crearActor('ADMINISTRATIVO');

    await sesionesChat(sinPermiso, participante.codigo).expect(403);
    await sesionesChat(coordinador, participante.codigo).expect(200);

    await otorgar(coordinador, {
      codigo_participante: participante.codigo,
      alcance: 'ACCESO_INDIVIDUAL',
      id_usuario_beneficiario: sinPermiso.id,
    }).expect(201);
    await sesionesChat(sinPermiso, participante.codigo).expect(200);

    const [intento] = await prisma.$queryRaw<{ total: number }[]>`
      SELECT count(*)::int AS total FROM administrativo.bitacora_auditoria
      WHERE id_usuario_administrativo = ${sinPermiso.id}::uuid
        AND accion = 'INTENTO_ACCESO_NO_AUTORIZADO' AND estado_accion = 'DENEGADA'
    `;
    expect(intento.total).toBe(1);
  });
});
