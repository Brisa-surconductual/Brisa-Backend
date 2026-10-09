import { createHash } from 'crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatModule } from '../../src/modules/chat/chat.module';
import { ContenidoVigenteUsuario } from '../../src/modules/cronograma/domain/entities/contenido-vigente-usuario.entity';
import { ModuloSistema } from '../../src/modules/cronograma/domain/entities/modulo-sistema.entity';
import { EstadoContenido } from '../../src/modules/cronograma/domain/enums/estado-contenido.enum';
import { TipoContenido } from '../../src/modules/cronograma/domain/enums/tipo-contenido.enum';
import { CronogramaUsuarioNoAsignadoException } from '../../src/modules/cronograma/domain/exeption/cronograma/cronograma-usuario-no-asignado.exception';
import { FechaInicioUsuarioNoRegistradaException } from '../../src/modules/cronograma/domain/exeption/cronograma/fecha-inicio-usuario-no-registrada.exception';
import { ContenidoVigenteUsuarioRepository } from '../../src/modules/cronograma/domain/repositories/contenido-vigente-usuario.repository';
import { ModuloSistemaRepository } from '../../src/modules/cronograma/domain/repositories/modulo-sistema.repository';
import { S3_CLIENT } from '../../src/modules/cronograma/infrastructure/storage/s3-client.provider';
import { SessionConfig } from '../../src/modules/usuarios/application/ports/session-config';
import { SessionCookieConfig } from '../../src/modules/usuarios/application/ports/session-cookie-config';
import { SessionTokenHasher } from '../../src/modules/usuarios/application/ports/session-token-hasher';
import { Sesion } from '../../src/modules/usuarios/domain/entities/sesiones.entity';
import { Usuario } from '../../src/modules/usuarios/domain/entities/usuarios.entity';
import { AlcanceSesion } from '../../src/modules/usuarios/domain/enums/alcance-sesion.enum';
import { EstadoCuenta } from '../../src/modules/usuarios/domain/enums/estado-cuenta';
import { EstadoRegistro } from '../../src/modules/usuarios/domain/enums/estado-registro.enum';
import { Rol } from '../../src/modules/usuarios/domain/enums/rol.enum';
import { SesionRepository } from '../../src/modules/usuarios/domain/repositories/sesion.repository';
import { UsuarioRepository } from '../../src/modules/usuarios/domain/repositories/user.repository';
import { CorreoElectronico } from '../../src/modules/usuarios/domain/value-objects/correo_electronico.vo';

describe('Contenido vigente - sesiones PWA de estudiante y administrativo (e2e)', () => {
  const ruta = '/chat/me/contenidos-vigentes';
  const idUsuarioA = '00000000-0000-4000-8000-000000000001';
  const idUsuarioB = '00000000-0000-4000-8000-000000000002';
  const idAdministrador = '00000000-0000-4000-8000-000000000006';
  const tokenA = 'sesion-estudiante-a';
  const tokenB = 'sesion-estudiante-b';
  const tokenAdministrador = 'sesion-administrativo';
  const hash = (valor: string) =>
    createHash('sha256').update(valor).digest('hex');
  const consultar = jest.fn<
    ReturnType<ContenidoVigenteUsuarioRepository['consultar']>,
    Parameters<ContenidoVigenteUsuarioRepository['consultar']>
  >();
  const buscarActivoPorCodigo = jest.fn();
  const buscarActivaPorTokenHash = jest.fn();
  const buscarPorId = jest.fn();
  const registrarActividad = jest.fn();
  const cerrarActiva = jest.fn();
  let app: INestApplication<App>;

  beforeAll(async () => {
    // Usa los módulos y bindings de producción. Sólo se sustituyen las fronteras
    // externas; no se reemplaza ningún guard, caso de uso ni adaptador entre módulos.
    const fixture = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot({ global: true }), ChatModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(S3_CLIENT)
      .useValue({ destroy: jest.fn() })
      .overrideProvider(ContenidoVigenteUsuarioRepository)
      .useValue({ consultar })
      .overrideProvider(ModuloSistemaRepository)
      .useValue({ listarActivos: jest.fn(), buscarActivoPorCodigo })
      .overrideProvider(SesionRepository)
      .useValue({ buscarActivaPorTokenHash, registrarActividad, cerrarActiva })
      .overrideProvider(UsuarioRepository)
      .useValue({ buscarPorId })
      .overrideProvider(SessionConfig)
      .useValue({
        obtenerLimiteInactividadMinutos: () => 15,
        obtenerLimiteSegundoPlanoMinutos: () => 15,
      })
      .overrideProvider(SessionCookieConfig)
      .useValue({ obtenerNombreCookie: () => 'brisa_session' })
      .overrideProvider(SessionTokenHasher)
      .useValue({ hash: (valor: string) => Promise.resolve(hash(valor)) })
      .compile();

    app = fixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.enableCors({
      origin: ['http://localhost:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
    });
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    buscarActivaPorTokenHash.mockImplementation((valor: string) => {
      if (valor === hash(tokenA))
        return Promise.resolve(crearSesion(idUsuarioA, tokenA));
      if (valor === hash(tokenB))
        return Promise.resolve(crearSesion(idUsuarioB, tokenB));
      if (valor === hash(tokenAdministrador))
        return Promise.resolve(
          crearSesion(idAdministrador, tokenAdministrador),
        );
      return Promise.resolve(null);
    });
    buscarPorId.mockImplementation((idUsuario: string) =>
      Promise.resolve(
        crearUsuario(
          idUsuario,
          idUsuario === idAdministrador ? Rol.ADMINISTRATIVO : Rol.ESTUDIANTE,
        ),
      ),
    );
    registrarActividad.mockResolvedValue(true);
    cerrarActiva.mockResolvedValue(true);
    buscarActivoPorCodigo.mockResolvedValue(
      new ModuloSistema('modulo-chat', 'CHAT', 'Chat'),
    );
    consultar.mockResolvedValue([crearContenido()]);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('retorna 200 con la cookie existente, sin API key ni encabezado de módulo', async () => {
    const antes = Date.now();
    const respuesta = await solicitud()
      .expect(200)
      .expect('Cache-Control', 'no-store');
    expect(respuesta.body).toEqual([contenidoHttp()]);
    expect(buscarActivoPorCodigo).toHaveBeenCalledWith('CHAT');
    expect(consultar).toHaveBeenCalledWith(idUsuarioA, expect.any(Date));
    const fechaConsulta = consultar.mock.calls[0][1];
    expect(fechaConsulta.getTime()).toBeGreaterThanOrEqual(antes);
    expect(fechaConsulta.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('mantiene aislados los contenidos de dos estudiantes con sesiones diferentes', async () => {
    consultar.mockImplementation((idUsuario: string) =>
      Promise.resolve([crearContenido(idUsuario)]),
    );
    await solicitud(tokenA)
      .expect(200)
      .expect([contenidoHttp(idUsuarioA)]);
    await solicitud(tokenB)
      .expect(200)
      .expect([contenidoHttp(idUsuarioB)]);
    expect(consultar.mock.calls.map(([id]) => id)).toEqual([
      idUsuarioA,
      idUsuarioB,
    ]);
  });

  it('retorna 204 sin cuerpo si no hay contenido vigente', async () => {
    consultar.mockResolvedValue([]);
    await solicitud()
      .expect(204)
      .expect('Cache-Control', 'no-store')
      .expect('');
  });

  it('rechaza 401 sin cookie aunque se envíen credenciales de módulo', async () => {
    await request(app.getHttpServer())
      .get(ruta)
      .set('Authorization', `Bearer ${'a'.repeat(40)}`)
      .set('X-Module-Code', 'CHAT')
      .expect(401);
    expect(consultar).not.toHaveBeenCalled();
  });

  it('rechaza 401 para una sesión inexistente o cerrada por logout', async () => {
    buscarActivaPorTokenHash.mockResolvedValue(null);
    await solicitud().expect(401);
    expect(consultar).not.toHaveBeenCalled();
  });

  it('cierra y rechaza 401 una sesión vencida antes de consultar Cronograma', async () => {
    buscarActivaPorTokenHash.mockResolvedValue(
      crearSesion(
        idUsuarioA,
        tokenA,
        AlcanceSesion.COMPLETA,
        new Date(Date.now() - 16 * 60_000),
      ),
    );
    await solicitud().expect(401);
    expect(cerrarActiva).toHaveBeenCalled();
    expect(consultar).not.toHaveBeenCalled();
  });

  it('rechaza 401 si la cuenta ya está bloqueada', async () => {
    buscarPorId.mockResolvedValue(
      crearUsuario(idUsuarioA, Rol.ESTUDIANTE, EstadoCuenta.BLOQUEADA),
    );
    await solicitud().expect(401);
    expect(consultar).not.toHaveBeenCalled();
  });

  it('rechaza 403 con sesión limitada', async () => {
    buscarActivaPorTokenHash.mockResolvedValue(
      crearSesion(idUsuarioA, tokenA, AlcanceSesion.LIMITADA),
    );
    await solicitud().expect(403);
    expect(consultar).not.toHaveBeenCalled();
  });

  it('rechaza 403 al rol administrativo en una ruta personal de estudiante', async () => {
    buscarPorId.mockResolvedValue(crearUsuario(idUsuarioA, Rol.ADMINISTRATIVO));
    await solicitud().expect(403);
    expect(consultar).not.toHaveBeenCalled();
  });

  it.each([
    { id_usuario: idUsuarioB },
    { fecha_consulta: '2099-01-01T00:00:00.000Z' },
    { codigo_modulo: 'NOTIF' },
    { otro: 'valor' },
  ])('rechaza 400 parámetros ajenos al contrato: %j', async (consulta) => {
    await solicitud().query(consulta).expect(400);
    expect(consultar).not.toHaveBeenCalled();
  });

  it('los encabezados del cliente no cambian ni el usuario ni el módulo', async () => {
    await solicitud()
      .set('X-User-Id', idUsuarioB)
      .set('X-Module-Code', 'NOTIF')
      .expect(200);
    expect(buscarActivoPorCodigo).toHaveBeenCalledWith('CHAT');
    expect(consultar).toHaveBeenCalledWith(idUsuarioA, expect.any(Date));
  });

  it('deniega 403 si CHAT ya no es un módulo activo', async () => {
    buscarActivoPorCodigo.mockResolvedValue(null);
    await solicitud().expect(403);
    expect(consultar).not.toHaveBeenCalled();
  });

  it('conserva 404 cuando el estudiante no tiene cronograma asignado', async () => {
    consultar.mockRejectedValue(new CronogramaUsuarioNoAsignadoException());
    await solicitud().expect(404);
  });

  it('conserva 422 si falta la fecha de inicio del estudiante', async () => {
    consultar.mockRejectedValue(new FechaInicioUsuarioNoRegistradaException());
    await solicitud().expect(422);
  });

  it('responde 500 sin revelar detalles inesperados del almacenamiento', async () => {
    consultar.mockRejectedValue(
      new Error('password authentication failed: secreto'),
    );
    const respuesta = await solicitud().expect(500);
    expect(respuesta.text).not.toContain('password');
    expect(respuesta.text).not.toContain('secreto');
  });

  it('permite el preflight de React con cookies sin habilitar encabezados internos', async () => {
    await request(app.getHttpServer())
      .options(ruta)
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'content-type')
      .expect(204)
      .expect('Access-Control-Allow-Origin', 'http://localhost:5173')
      .expect('Access-Control-Allow-Credentials', 'true')
      .expect('Access-Control-Allow-Headers', 'Content-Type,X-CSRF-Token');
    expect(consultar).not.toHaveBeenCalled();
  });

  it.each(['post', 'patch', 'delete'] as const)(
    'no permite modificar contenido con %s',
    async (metodo) => {
      await request(app.getHttpServer())
        [metodo](ruta)
        .set('Cookie', `brisa_session=${tokenA}`)
        .expect(404);
      expect(consultar).not.toHaveBeenCalled();
    },
  );

  function solicitud(token = tokenA): request.Test {
    return request(app.getHttpServer())
      .get(ruta)
      .set('Cookie', `brisa_session=${token}`);
  }

  describe('consulta administrativa de un estudiante', () => {
    const rutaAdministrativa = (idUsuario = idUsuarioA) =>
      `/cronograma/usuarios/${idUsuario}/contenidos-vigentes`;

    function solicitudAdministrativa(
      idUsuario = idUsuarioA,
      token = tokenAdministrador,
    ): request.Test {
      return request(app.getHttpServer())
        .get(rutaAdministrativa(idUsuario))
        .set('Cookie', `brisa_session=${token}`);
    }

    it('retorna 200 con cookie administrativa y la hora del servidor, sin API key', async () => {
      const antes = Date.now();
      await solicitudAdministrativa()
        .expect(200)
        .expect('Cache-Control', 'no-store')
        .expect([contenidoHttp()]);
      expect(consultar).toHaveBeenCalledWith(idUsuarioA, expect.any(Date));
      expect(consultar).toHaveBeenCalledTimes(1);
      const fechaConsulta = consultar.mock.calls[0][1];
      expect(fechaConsulta.getTime()).toBeGreaterThanOrEqual(antes);
      expect(fechaConsulta.getTime()).toBeLessThanOrEqual(Date.now());
      expect(buscarActivoPorCodigo).not.toHaveBeenCalled();
    });

    it('consulta al estudiante seleccionado en la ruta y no al administrativo autenticado', async () => {
      consultar.mockImplementation((idUsuario: string) =>
        Promise.resolve([crearContenido(idUsuario)]),
      );
      await solicitudAdministrativa(idUsuarioA)
        .expect(200)
        .expect([contenidoHttp(idUsuarioA)]);
      await solicitudAdministrativa(idUsuarioB)
        .expect(200)
        .expect([contenidoHttp(idUsuarioB)]);
      expect(consultar.mock.calls.map(([id]) => id)).toEqual([
        idUsuarioA,
        idUsuarioB,
      ]);
    });

    it('retorna 204 sin cuerpo cuando no hay contenido vigente', async () => {
      consultar.mockResolvedValue([]);
      await solicitudAdministrativa()
        .expect(204)
        .expect('Cache-Control', 'no-store')
        .expect('');
    });

    it('rechaza 401 sin cookie aunque se envíen credenciales de módulo y un rol declarado', async () => {
      await request(app.getHttpServer())
        .get(rutaAdministrativa())
        .set('Authorization', `Bearer ${'a'.repeat(40)}`)
        .set('X-Module-Code', 'CHAT')
        .set('X-Role', 'ADMINISTRATIVO')
        .expect(401);
      expect(consultar).not.toHaveBeenCalled();
    });

    it('rechaza 401 después del logout o con una sesión inexistente', async () => {
      buscarActivaPorTokenHash.mockResolvedValue(null);
      await solicitudAdministrativa().expect(401);
      expect(consultar).not.toHaveBeenCalled();
    });

    it('cierra y rechaza 401 una sesión administrativa vencida', async () => {
      buscarActivaPorTokenHash.mockResolvedValue(
        crearSesion(
          idAdministrador,
          tokenAdministrador,
          AlcanceSesion.COMPLETA,
          new Date(Date.now() - 16 * 60_000),
        ),
      );
      await solicitudAdministrativa().expect(401);
      expect(cerrarActiva).toHaveBeenCalled();
      expect(consultar).not.toHaveBeenCalled();
    });

    it('rechaza 401 si la cuenta administrativa está bloqueada', async () => {
      buscarPorId.mockResolvedValue(
        crearUsuario(
          idAdministrador,
          Rol.ADMINISTRATIVO,
          EstadoCuenta.BLOQUEADA,
        ),
      );
      await solicitudAdministrativa().expect(401);
      expect(consultar).not.toHaveBeenCalled();
    });

    it('rechaza 403 si la sesión administrativa es limitada', async () => {
      buscarActivaPorTokenHash.mockResolvedValue(
        crearSesion(
          idAdministrador,
          tokenAdministrador,
          AlcanceSesion.LIMITADA,
        ),
      );
      await solicitudAdministrativa().expect(403);
      expect(consultar).not.toHaveBeenCalled();
    });

    it.each([tokenA, tokenB])(
      'rechaza 403 a un estudiante aunque declare rol administrativo (%s)',
      async (token) => {
        await solicitudAdministrativa(idUsuarioA, token)
          .set('X-Role', 'ADMINISTRATIVO')
          .expect(403);
        expect(consultar).not.toHaveBeenCalled();
      },
    );

    it('conserva 403 para la sesión administrativa real en la ruta personal del estudiante', async () => {
      await solicitud(tokenAdministrador).expect(403);
      expect(consultar).not.toHaveBeenCalled();
    });

    it.each(['no-es-un-uuid', "1' OR '1'='1"])(
      'rechaza 400 el identificador inválido %s antes de consultar',
      async (idUsuario) => {
        await solicitudAdministrativa(encodeURIComponent(idUsuario)).expect(
          400,
        );
        expect(consultar).not.toHaveBeenCalled();
      },
    );

    it.each([
      { id_usuario: idUsuarioB },
      { fecha_consulta: '2099-01-01T00:00:00.000Z' },
      { codigo_modulo: 'NOTIF' },
      { otro: 'valor' },
    ])('rechaza 400 parámetros ajenos al contrato: %j', async (consulta) => {
      await solicitudAdministrativa().query(consulta).expect(400);
      expect(consultar).not.toHaveBeenCalled();
    });

    it('los encabezados del cliente no sustituyen el UUID de la ruta', async () => {
      await solicitudAdministrativa()
        .set('X-User-Id', idUsuarioB)
        .set('X-Module-Code', 'NOTIF')
        .expect(200);
      expect(consultar).toHaveBeenCalledWith(idUsuarioA, expect.any(Date));
      expect(buscarActivoPorCodigo).not.toHaveBeenCalled();
    });

    it('no depende de CHAT activo y conserva la restricción de la ruta personal', async () => {
      buscarActivoPorCodigo.mockResolvedValue(null);
      await solicitudAdministrativa().expect(200);
      expect(buscarActivoPorCodigo).not.toHaveBeenCalled();
      await solicitud().expect(403);
      expect(buscarActivoPorCodigo).toHaveBeenCalledWith('CHAT');
      expect(consultar).toHaveBeenCalledTimes(1);
    });

    it('conserva 404 si el UUID no tiene cronograma asignado', async () => {
      consultar.mockRejectedValue(new CronogramaUsuarioNoAsignadoException());
      await solicitudAdministrativa().expect(404);
    });

    it('conserva 422 si el estudiante no tiene fecha de inicio', async () => {
      consultar.mockRejectedValue(
        new FechaInicioUsuarioNoRegistradaException(),
      );
      await solicitudAdministrativa().expect(422);
    });

    it('responde 500 sin filtrar detalles de infraestructura', async () => {
      consultar.mockRejectedValue(
        new Error('password authentication failed: secreto'),
      );
      const respuesta = await solicitudAdministrativa().expect(500);
      expect(respuesta.text).not.toContain('password');
      expect(respuesta.text).not.toContain('secreto');
    });

    it('permite el preflight administrativo con cookies sin habilitar encabezados internos', async () => {
      await request(app.getHttpServer())
        .options(rutaAdministrativa())
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'content-type')
        .expect(204)
        .expect('Access-Control-Allow-Origin', 'http://localhost:5173')
        .expect('Access-Control-Allow-Credentials', 'true')
        .expect('Access-Control-Allow-Headers', 'Content-Type,X-CSRF-Token');
      expect(consultar).not.toHaveBeenCalled();
    });

    it.each(['post', 'patch', 'delete'] as const)(
      'no permite modificar el contenido mediante %s',
      async (metodo) => {
        await request(app.getHttpServer())
          [metodo](rutaAdministrativa())
          .set('Cookie', `brisa_session=${tokenAdministrador}`)
          .expect(404);
        expect(consultar).not.toHaveBeenCalled();
      },
    );
  });

  function crearSesion(
    idUsuario: string,
    token: string,
    alcance = AlcanceSesion.COMPLETA,
    fecha = new Date(),
  ): Sesion {
    return Sesion.iniciar(
      idUsuario,
      hash(token),
      'hash-csrf',
      alcance,
      15,
      fecha,
    );
  }

  function crearUsuario(
    idUsuario: string,
    rol = Rol.ESTUDIANTE,
    estado = EstadoCuenta.ACTIVA,
  ): Usuario {
    return new Usuario(
      idUsuario,
      new CorreoElectronico('estudiante@usco.edu.co'),
      'hash-contrasena',
      rol,
      EstadoRegistro.REGISTRO_COMPLETO,
      estado,
      new Date(),
      new Date(),
      true,
      true,
      'consentimiento-1',
    );
  }

  function crearContenido(
    idContenido = '00000000-0000-4000-8000-000000000003',
  ): ContenidoVigenteUsuario {
    return new ContenidoVigenteUsuario(
      idContenido,
      '00000000-0000-4000-8000-000000000004',
      'Prevención de recaídas',
      TipoContenido.INFORMATIVO,
      '00000000-0000-4000-8000-000000000005',
      'Semana 1',
      1,
      1,
      new Date('2026-10-01T00:00:00.000Z'),
      new Date('2026-10-15T00:00:00.000Z'),
      EstadoContenido.ACTIVO,
    );
  }

  function contenidoHttp(
    idContenido = '00000000-0000-4000-8000-000000000003',
  ): Record<string, unknown> {
    return {
      id_contenido: idContenido,
      id_contenido_cronograma: '00000000-0000-4000-8000-000000000004',
      nombre_contenido: 'Prevención de recaídas',
      tipo_contenido: TipoContenido.INFORMATIVO,
      id_unidad_temporal: '00000000-0000-4000-8000-000000000005',
      nombre_unidad: 'Semana 1',
      orden_unidad: 1,
      orden_contenido: 1,
      estado_disponibilidad: EstadoContenido.ACTIVO,
      fecha_inicio_disponibilidad: '2026-10-01T00:00:00.000Z',
      fecha_fin_disponibilidad: '2026-10-15T00:00:00.000Z',
    };
  }
});
