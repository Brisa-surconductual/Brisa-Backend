import {
  ConflictException,
  INestApplication,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import type { App } from 'supertest/types';
import { RolesGuard } from '../../../../../shared/presentation/guards/role-guard';
import { SessionConfig } from '../../../../usuarios/application/ports/session-config';
import { SessionCookieConfig } from '../../../../usuarios/application/ports/session-cookie-config';
import { SessionTokenHasher } from '../../../../usuarios/application/ports/session-token-hasher';
import { SesionRepository } from '../../../../usuarios/domain/repositories/sesion.repository';
import { UsuarioRepository } from '../../../../usuarios/domain/repositories/user.repository';
import { SessionScopeGuard } from '../../../../usuarios/presentation/guards/session-scope.guard';
import { IniciarOReanudarSesionUseCase } from '../../../application/use-cases/sesion/iniciar-o-reanudar-sesion.use-case';
import {
  EstadoSesionInconsistenteException,
  SesionErrorConfiguracionException,
} from '../../../domain/exceptions/sesion.exceptions';
import { SesionesConversacionalesController } from './sesiones-conversacionales.controller';

describe('RF-24 / RF-32 POST /chat/sesiones/iniciar (HTTP)', () => {
  const ruta = '/chat/sesiones/iniciar';
  const idUsuario = '00000000-0000-4000-8000-000000000001';
  const execute = jest.fn();
  const autorizarAlcance = jest.fn(() => true);
  const autorizarRol = jest.fn(() => true);
  const resultadoNuevo = {
    reanudada: false,
    recuperada_desde_historial: false,
    sesion: {
      id_sesion: '00000000-0000-4000-8000-000000000002',
      id_flujo_conversacional: '00000000-0000-4000-8000-000000000003',
      version_arbol_utilizada: 1,
      modalidad_activa: 'GRUPAL',
      tipo_dependencia: null,
      tipo_craving: null,
      estado_actual: 'ACTIVA',
      fecha_inicio: '2026-10-19T12:00:00.000Z',
      fecha_ultima_interaccion: '2026-10-19T12:00:00.000Z',
      ultima_secuencia: 0,
    },
    nodo_actual: {
      id_nodo: '00000000-0000-4000-8000-000000000004',
      tipo_nodo: 'PREGUNTA',
      es_terminal: false,
      bloques: [{ orden: 1, tipo: 'TEXTO', texto: 'Bienvenido' }],
      entrada: { tipo: 'ESCALA' },
    },
    historial_reciente: { items: [], hay_mas: false, siguiente_cursor: null },
    ubicacion_temporal: {
      id_unidad_temporal: '00000000-0000-4000-8000-000000000005',
      nombre_unidad: 'Semana 1',
      finalizado_programa: false,
    },
  };

  let app: INestApplication<App>;
  const post = () =>
    request(app.getHttpServer())
      .post(ruta)
      .set('Cookie', 'brisa_sesion=auth-local')
      .set('X-CSRF-Token', 'csrf-local');

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [SesionesConversacionalesController],
      providers: [
        { provide: IniciarOReanudarSesionUseCase, useValue: { execute } },
        {
          provide: SessionConfig,
          useValue: { obtenerLimiteSegundoPlanoMinutos: () => 5 },
        },
        {
          provide: SessionCookieConfig,
          useValue: { obtenerNombreCookie: () => 'brisa_sesion' },
        },
        {
          provide: SessionTokenHasher,
          useValue: {
            hash: (token: string) => Promise.resolve(token),
            compare: (token: string, esperado: string) =>
              Promise.resolve(token === esperado),
          },
        },
        {
          provide: SesionRepository,
          useValue: {
            buscarActivaPorTokenHash: (token: string) =>
              Promise.resolve(
                token === 'auth-local'
                  ? {
                      id_usuario: idUsuario,
                      csrf_token_hash: 'csrf-local',
                      obtenerMotivoExpiracion: () => null,
                    }
                  : null,
              ),
            registrarActividad: () => Promise.resolve(true),
          },
        },
        {
          provide: UsuarioRepository,
          useValue: {
            buscarPorId: () =>
              Promise.resolve({
                id_usuario: idUsuario,
                estadoCuenta: 'ACTIVA',
                rol: 'ESTUDIANTE',
              }),
          },
        },
      ],
    })
      .overrideGuard(SessionScopeGuard)
      .useValue({ canActivate: autorizarAlcance })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: autorizarRol })
      .compile();

    app = modulo.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    autorizarAlcance.mockReturnValue(true);
    autorizarRol.mockReturnValue(true);
  });

  afterAll(async () => app.close());

  it('responde 201 con cookie y CSRF válidos al iniciar una sesión', async () => {
    execute.mockResolvedValue(resultadoNuevo);
    await post()
      .expect(201)
      .expect('Cache-Control', 'no-store')
      .expect({ data: resultadoNuevo });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith(idUsuario);
  });

  it('responde 200 al retomar la sesión y presenta el nodo recuperado', async () => {
    const data = {
      ...resultadoNuevo,
      reanudada: true,
      recuperada_desde_historial: true,
    };
    execute.mockResolvedValue(data);
    await post().expect(200).expect({ data });
    expect(execute).toHaveBeenCalledWith(idUsuario);
  });

  it('toma el usuario de la cookie aunque el cuerpo indique otro', async () => {
    execute.mockResolvedValue(resultadoNuevo);
    await post().send({ id_usuario: 'otro-usuario' }).expect(201);
    expect(execute).toHaveBeenCalledWith(idUsuario);
  });

  it('responde 401 aun con Authorization si falta la cookie', async () => {
    await request(app.getHttpServer())
      .post(ruta)
      .set('Authorization', 'Bearer auth-local')
      .set('X-CSRF-Token', 'csrf-local')
      .expect(401);
    expect(execute).not.toHaveBeenCalled();
  });

  it.each([undefined, 'incorrecto'])(
    'responde 403 CSRF_INVALIDO con token %s',
    async (token) => {
      const solicitud = request(app.getHttpServer())
        .post(ruta)
        .set('Cookie', 'brisa_sesion=auth-local');
      if (token !== undefined) solicitud.set('X-CSRF-Token', token);
      const r = await solicitud.expect(403);
      expect(r.body).toMatchObject({
        statusCode: 403,
        codigo: 'CSRF_INVALIDO',
      });
      expect(execute).not.toHaveBeenCalled();
    },
  );

  it('responde 403 cuando la sesión no tiene el alcance requerido', async () => {
    autorizarAlcance.mockReturnValue(false);
    await post().expect(403);
    expect(execute).not.toHaveBeenCalled();
  });

  it('responde 403 cuando el rol no está autorizado', async () => {
    autorizarRol.mockReturnValue(false);
    await post().expect(403);
    expect(execute).not.toHaveBeenCalled();
  });

  it.each([
    [
      404,
      'SIN_FLUJO_PUBLICADO',
      new NotFoundException({ codigo: 'SIN_FLUJO_PUBLICADO' }),
    ],
    [
      409,
      'PERFIL_INCOMPLETO',
      new ConflictException({ codigo: 'PERFIL_INCOMPLETO' }),
    ],
    [409, 'ESTADO_INCONSISTENTE', new EstadoSesionInconsistenteException()],
    [
      409,
      'SESION_ERROR_CONFIGURACION',
      new SesionErrorConfiguracionException(),
    ],
    [
      422,
      'SIN_CRONOGRAMA',
      new UnprocessableEntityException({ codigo: 'SIN_CRONOGRAMA' }),
    ],
  ])('devuelve %s con el código %s', async (estado, codigo, error) => {
    execute.mockRejectedValue(error);
    const r = await post().expect(estado);
    expect(r.body).toMatchObject({ statusCode: estado, codigo });
  });

  it('oculta errores internos de recuperación', async () => {
    execute.mockRejectedValue(new Error('detalle de PostgreSQL'));
    const r = await post().expect(500);
    expect(r.body).toMatchObject({
      mensaje:
        'No fue posible recuperar la sesión en este momento. Intente nuevamente más tarde.',
    });
    expect(r.text).not.toContain('detalle de PostgreSQL');
  });
});
