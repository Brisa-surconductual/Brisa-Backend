import {
  ConflictException,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { RolesGuard } from '../../../../../shared/presentation/guards/role-guard';
import { Rol } from '../../../../usuarios/domain/enums/rol.enum';
import { CsrfSessionGuard } from '../../../../usuarios/presentation/guards/csrf-session.guard';
import { SessionAuthGuard } from '../../../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../../../usuarios/presentation/guards/session-scope.guard';
import { HabilitarModalidadPersonalizadaUseCase } from '../../../application/use-cases/modalidad/habilitar-modalidad-personalizada.use-case';
import { ConsultarElegibilidadModalidadUseCase } from '../../../application/use-cases/modalidad/consultar-elegibilidad-modalidad.use-case';
import { ModalidadProgramaController } from './modalidad-programa.controller';

describe('RF-25B - POST habilitar-personalizada (HTTP)', () => {
  const ruta = '/chat/admin/modalidad/habilitar-personalizada';
  const idAdministrador = '00000000-0000-4000-8000-000000000001';
  const execute = jest.fn();

  let app: INestApplication<App>;
  let rolActual: Rol;

  const autenticar = jest.fn((context: ExecutionContext) => {
    const solicitud = context.switchToHttp().getRequest<any>();
    solicitud.autenticacion = {
      usuario: {
        id_usuario: idAdministrador,
        rol: rolActual,
      },
    };
    return true;
  });

  const autorizarAlcance = jest.fn(() => true);
  const autorizarCsrf = jest.fn(() => true);

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [ModalidadProgramaController],
      providers: [
        {
          provide: HabilitarModalidadPersonalizadaUseCase,
          useValue: { execute },
        },
        { provide: ConsultarElegibilidadModalidadUseCase, useValue: {} },
        RolesGuard,
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: autenticar })
      .overrideGuard(SessionScopeGuard)
      .useValue({ canActivate: autorizarAlcance })
      .overrideGuard(CsrfSessionGuard)
      .useValue({ canActivate: autorizarCsrf })
      .compile();

    app = modulo.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    execute.mockReset();
    execute.mockImplementation((datos, idAdmin) =>
      new HabilitarModalidadPersonalizadaUseCase({
        listarAsignacionesVigentesPorPrograma: jest.fn(),
        guardarAsignaciones: jest.fn(),
      }).execute(datos, idAdmin),
    );
    rolActual = Rol.ADMINISTRATIVO;
    autorizarAlcance.mockReturnValue(true);
    autorizarCsrf.mockReturnValue(true);
    autenticar.mockImplementation((context: ExecutionContext) => {
      const solicitud = context.switchToHttp().getRequest<any>();
      solicitud.autenticacion = {
        usuario: {
          id_usuario: idAdministrador,
          rol: rolActual,
        },
      };
      return true;
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('responde 200 ante una transicion confirmada', async () => {
    execute.mockResolvedValue({
      id_programa: 12,
      modalidad: 'PERSONALIZADA',
      usuarios_actualizados: 3,
      fecha_vigencia_desde: '2026-10-20T12:00:00.000Z',
      administrador_responsable: idAdministrador,
    });

    await request(app.getHttpServer())
      .post(ruta)
      .send({
        id_programa: 12,
        confirmacion_transicion: true,
      })
      .expect(200)
      .expect('Cache-Control', 'no-store')
      .expect({
        id_programa: 12,
        modalidad: 'PERSONALIZADA',
        usuarios_actualizados: 3,
        fecha_vigencia_desde: '2026-10-20T12:00:00.000Z',
        administrador_responsable: idAdministrador,
      });

    expect(execute).toHaveBeenCalledWith(
      { id_programa: 12, confirmacion_transicion: true },
      idAdministrador,
    );
  });

  it('responde 400 con un programa invalido', async () => {
    await request(app.getHttpServer())
      .post(ruta)
      .send({
        id_programa: 'invalido',
        confirmacion_transicion: true,
      })
      .expect(400);

    expect(execute).not.toHaveBeenCalled();
  });

  it('responde 400 sin confirmacion explicita', async () => {
    await request(app.getHttpServer())
      .post(ruta)
      .send({ id_programa: 12 })
      .expect(400);

    expect(execute).toHaveBeenCalledWith({ id_programa: 12 }, idAdministrador);
  });

  it('rechaza una confirmacion enviada como texto', async () => {
    await request(app.getHttpServer())
      .post(ruta)
      .send({
        id_programa: 12,
        confirmacion_transicion: 'true',
      })
      .expect(400);
  });

  it('responde 401 sin autenticacion valida', async () => {
    autenticar.mockImplementationOnce(() => {
      throw new UnauthorizedException();
    });

    await request(app.getHttpServer())
      .post(ruta)
      .send({
        id_programa: 12,
        confirmacion_transicion: true,
      })
      .expect(401);

    expect(execute).not.toHaveBeenCalled();
  });

  it('responde 403 para un estudiante', async () => {
    rolActual = Rol.ESTUDIANTE;

    await request(app.getHttpServer())
      .post(ruta)
      .send({
        id_programa: 12,
        confirmacion_transicion: true,
      })
      .expect(403);

    expect(execute).not.toHaveBeenCalled();
  });

  it('responde 403 cuando CSRF rechaza la solicitud', async () => {
    autorizarCsrf.mockReturnValue(false);

    await request(app.getHttpServer())
      .post(ruta)
      .send({
        id_programa: 12,
        confirmacion_transicion: true,
      })
      .expect(403);

    expect(execute).not.toHaveBeenCalled();
  });

  it('propaga el error 409 por perfiles incompletos', async () => {
    execute.mockRejectedValue(
      new ConflictException({
        codigo: 'PERFILES_INCOMPLETOS',
        sin_perfil_completo: 2,
      }),
    );

    const respuesta = await request(app.getHttpServer())
      .post(ruta)
      .send({
        id_programa: 12,
        confirmacion_transicion: true,
      })
      .expect(409);

    expect(respuesta.body.codigo).toBe('PERFILES_INCOMPLETOS');
    expect(respuesta.body.sin_perfil_completo).toBe(2);
  });
});
