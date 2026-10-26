import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { RolesGuard } from '../../../shared/presentation/guards/role-guard';
import { Rol } from '../../usuarios/domain/enums/rol.enum';
import { SessionAuthGuard } from '../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../usuarios/presentation/guards/session-scope.guard';
import { ConsultarElegibilidadModalidadUseCase } from '../application/use-cases/consultar-elegibilidad-modalidad.use-case';
import { ModalidadProgramaAdminController } from './modalidad-programa-admin.controller';

describe('RF-25B - GET /chat/admin/modalidad/elegibilidad (HTTP)', () => {
  const ruta = '/chat/admin/modalidad/elegibilidad';
  const execute = jest.fn();

  let app: INestApplication<App>;
  let rolActual: Rol = Rol.ADMINISTRATIVO;

  const autenticar = jest.fn((context: ExecutionContext) => {
    const solicitud = context.switchToHttp().getRequest<{
      autenticacion?: {
        usuario: { rol: Rol };
      };
    }>();

    solicitud.autenticacion = {
      usuario: { rol: rolActual },
    };

    return true;
  });

  const autorizarAlcance = jest.fn(() => true);

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [ModalidadProgramaAdminController],
      providers: [
        {
          provide: ConsultarElegibilidadModalidadUseCase,
          useValue: { execute },
        },
        RolesGuard,
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: autenticar })
      .overrideGuard(SessionScopeGuard)
      .useValue({ canActivate: autorizarAlcance })
      .compile();

    app = modulo.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    execute.mockReset();

    rolActual = Rol.ADMINISTRATIVO;

    autenticar.mockReset();
    autenticar.mockImplementation((context: ExecutionContext) => {
      const solicitud = context.switchToHttp().getRequest<{
        autenticacion?: {
          usuario: { rol: Rol };
        };
      }>();

      solicitud.autenticacion = {
        usuario: { rol: rolActual },
      };

      return true;
    });

    autorizarAlcance.mockReset();
    autorizarAlcance.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('responde 200 para un administrador autorizado', async () => {
    execute.mockResolvedValue({
      idPrograma: 12,
      modalidadActual: 'GRUPAL',
      totalUsuariosActivos: 3,
      conPerfilCompleto: 3,
      sinPerfilCompleto: 0,
      elegible: true,
    });

    await request(app.getHttpServer())
      .get(ruta)
      .query({ id_programa: 12 })
      .expect(200)
      .expect('Cache-Control', 'no-store')
      .expect({
        id_programa: 12,
        modalidad_actual: 'GRUPAL',
        total_usuarios_activos: 3,
        con_perfil_completo: 3,
        sin_perfil_completo: 0,
        elegible: true,
      });

    expect(execute).toHaveBeenCalledWith(12);
  });

  it('responde 400 para un id_programa no numerico', async () => {
    await request(app.getHttpServer())
      .get(ruta)
      .query({ id_programa: 'invalido' })
      .expect(400);

    expect(execute).not.toHaveBeenCalled();
  });

  it('responde 400 cuando falta id_programa', async () => {
    await request(app.getHttpServer())
      .get(ruta)
      .expect(400);

    expect(execute).not.toHaveBeenCalled();
  });

  it('responde 401 cuando falla la autenticacion', async () => {
    autenticar.mockImplementationOnce(() => {
      throw new UnauthorizedException();
    });

    await request(app.getHttpServer())
      .get(ruta)
      .query({ id_programa: 12 })
      .expect(401);

    expect(execute).not.toHaveBeenCalled();
  });

  it('responde 403 cuando el alcance es insuficiente', async () => {
    autorizarAlcance.mockReturnValue(false);

    await request(app.getHttpServer())
      .get(ruta)
      .query({ id_programa: 12 })
      .expect(403);

    expect(execute).not.toHaveBeenCalled();
  });

  it('responde 403 cuando un estudiante intenta consultar', async () => {
    rolActual = Rol.ESTUDIANTE;

    await request(app.getHttpServer())
      .get(ruta)
      .query({ id_programa: 12 })
      .expect(403);

    expect(execute).not.toHaveBeenCalled();
  });
});
