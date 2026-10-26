import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { RolesGuard } from '../../../shared/presentation/guards/role-guard';
import { CsrfSessionGuard } from '../../usuarios/presentation/guards/csrf-session.guard';
import { SessionAuthGuard } from '../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../usuarios/presentation/guards/session-scope.guard';
import { IniciarOReanudarSesionUseCase } from '../application/use-cases/iniciar-o-reanudar-sesion.use-case';
import { SesionesConversacionalesController } from './sesiones-conversacionales.controller';
import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';

describe('RF-24 - POST /chat/sesiones/iniciar (HTTP)', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000001';
  const execute = jest.fn();

  const autenticar = jest.fn((context: ExecutionContext) => {
    const solicitud = context.switchToHttp().getRequest<{
      autenticacion?: { usuario: { id_usuario: string } };
    }>();

    solicitud.autenticacion = {
      usuario: { id_usuario: idUsuario },
    };

    return true;
  });

  const autorizarAlcance = jest.fn(() => true);
  const autorizarRol = jest.fn(() => true);
  const autorizarCsrf = jest.fn(() => true);

  const resultadoNuevo = {
    reanudada: false,
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
    },
    nodo_actual: {
      id_nodo: '00000000-0000-4000-8000-000000000004',
      tipo_nodo: 'MENSAJE',
      contenido: { texto: 'Bienvenido' },
      es_nodo_inicial: true,
      orden: 1,
    },
    ubicacion_temporal: {
      id_unidad_temporal: '00000000-0000-4000-8000-000000000005',
      nombre_unidad: 'Semana 1',
      finalizado_programa: false,
    },
  };

  let app: INestApplication<App>;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [SesionesConversacionalesController],
      providers: [
        {
          provide: IniciarOReanudarSesionUseCase,
          useValue: { execute },
        },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: autenticar })
      .overrideGuard(SessionScopeGuard)
      .useValue({ canActivate: autorizarAlcance })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: autorizarRol })
      .overrideGuard(CsrfSessionGuard)
      .useValue({ canActivate: autorizarCsrf })
      .compile();

    app = modulo.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    jest.resetAllMocks();

    autenticar.mockImplementation((context: ExecutionContext) => {
      const solicitud = context.switchToHttp().getRequest<{
        autenticacion?: { usuario: { id_usuario: string } };
      }>();

      solicitud.autenticacion = {
        usuario: { id_usuario: idUsuario },
      };

      return true;
    });

    autorizarAlcance.mockReturnValue(true);
    autorizarRol.mockReturnValue(true);
    autorizarCsrf.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('responde 201 al iniciar una sesión nueva', async () => {
    execute.mockResolvedValue(resultadoNuevo);

    await request(app.getHttpServer())
      .post('/chat/sesiones/iniciar')
      .send({})
      .expect(201)
      .expect('Cache-Control', 'no-store')
      .expect({ data: resultadoNuevo });

    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith(idUsuario);
  });

  it('responde 200 al reanudar una sesión', async () => {
    const resultadoReanudado = {
      ...resultadoNuevo,
      reanudada: true,
    };

    execute.mockResolvedValue(resultadoReanudado);

    await request(app.getHttpServer())
      .post('/chat/sesiones/iniciar')
      .send({})
      .expect(200)
      .expect({ data: resultadoReanudado });

    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith(idUsuario);
  });

  it('rechaza un cuerpo con datos adicionales mediante HTTP 400', async () => {
    await request(app.getHttpServer())
      .post('/chat/sesiones/iniciar')
      .send({ id_usuario: idUsuario })
      .expect(400);

    expect(execute).not.toHaveBeenCalled();
  });

  it('bloquea la petición cuando el guard CSRF deniega el acceso', async () => {
    autorizarCsrf.mockReturnValue(false);

    await request(app.getHttpServer())
      .post('/chat/sesiones/iniciar')
      .send({})
      .expect(403);

    expect(execute).not.toHaveBeenCalled();
  });

  it('responde 401 cuando falla la autenticación', async () => {
    autenticar.mockImplementationOnce(() => {
      throw new UnauthorizedException();
    });

    await request(app.getHttpServer())
      .post('/chat/sesiones/iniciar')
      .send({})
      .expect(401);

    expect(execute).not.toHaveBeenCalled();
  });

  it('responde 403 cuando la sesión no tiene el alcance requerido', async () => {
    autorizarAlcance.mockReturnValue(false);

    await request(app.getHttpServer())
      .post('/chat/sesiones/iniciar')
      .send({})
      .expect(403);

    expect(execute).not.toHaveBeenCalled();
  });

  it('responde 403 cuando el rol no está autorizado', async () => {
    autorizarRol.mockReturnValue(false);

    await request(app.getHttpServer())
      .post('/chat/sesiones/iniciar')
      .send({})
      .expect(403);

    expect(execute).not.toHaveBeenCalled();
  });
});
