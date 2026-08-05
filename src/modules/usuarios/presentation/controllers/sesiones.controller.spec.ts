import type { Response } from 'express';
import { IniciarSesionDtoResponse } from '../../application/dto/iniciar-sesion.dto-response';
import { EstadoAplicacionDto } from '../../application/dto/registrar-actividad-sesion.dto-request';
import { AlcanceSesion } from '../../domain/enums/alcance-sesion.enum';
import type { AuthenticatedSessionRequest } from '../http/authenticated-session-request';
import { SesionesController } from './sesiones.controller';

describe('SesionesController', () => {
  const iniciarSesionUseCase = { execute: jest.fn() };
  const cerrarSesionUseCase = { execute: jest.fn() };
  const registrarActividadSesionUseCase = { execute: jest.fn() };
  const renovarCsrfSesionUseCase = { execute: jest.fn() };
  const cookieConfig = {
    obtenerNombreCookie: jest.fn().mockReturnValue('brisa_session'),
    esSegura: jest.fn().mockReturnValue(true),
    obtenerSameSite: jest.fn().mockReturnValue('lax'),
  };

  let controller: SesionesController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new SesionesController(
      iniciarSesionUseCase as never,
      cerrarSesionUseCase as never,
      registrarActividadSesionUseCase as never,
      renovarCsrfSesionUseCase as never,
      cookieConfig as never,
    );
  });

  it('entrega el token opaco solo mediante una cookie HttpOnly', async () => {
    const respuesta = IniciarSesionDtoResponse.crear({
      idUsuario: 'usuario-id',
      alcance: AlcanceSesion.COMPLETA,
      estadoRegistro: 'REGISTRO_COMPLETO',
      rol: 'ESTUDIANTE',
      siguienteAccion: 'INGRESAR',
      limiteInactividadMinutos: 15,
      csrfToken: 'csrf-publico',
      mensaje: 'Inicio de sesion exitoso.',
    });
    iniciarSesionUseCase.execute.mockResolvedValue({
      tokenSesion: 'token-cookie-secreto',
      respuesta,
    });
    const response = crearResponse();

    const resultado = await controller.iniciarSesion(
      {
        correoElectronico: 'usuario@example.com',
        contrasena: 'Segura1!',
      },
      response,
    );

    expect(resultado).toBe(respuesta);
    expect(resultado).not.toHaveProperty('tokenSesion');
    expect(response.cookie).toHaveBeenCalledWith(
      'brisa_session',
      'token-cookie-secreto',
      {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      },
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'no-store, max-age=0',
    );
  });

  it('cierra la sesion obtenida del guard y elimina la cookie', async () => {
    cerrarSesionUseCase.execute.mockResolvedValue({ mensaje: 'cerrada' });
    const request = crearRequestAutenticado('sesion-autenticada');
    const response = crearResponse();

    await controller.cerrarSesion(request, response);

    expect(cerrarSesionUseCase.execute).toHaveBeenCalledWith(
      'sesion-autenticada',
    );
    expect(response.clearCookie).toHaveBeenCalledWith('brisa_session', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
  });

  it('ignora identificadores del cliente al registrar actividad', async () => {
    const dto = { estadoAplicacion: EstadoAplicacionDto.ACTIVA };
    registrarActividadSesionUseCase.execute.mockResolvedValue({ activa: true });

    await controller.registrarActividad(
      crearRequestAutenticado('sesion-del-guard'),
      dto,
      crearResponse(),
    );

    expect(registrarActividadSesionUseCase.execute).toHaveBeenCalledWith(
      'sesion-del-guard',
      dto,
    );
  });
});

function crearResponse(): Response {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    setHeader: jest.fn(),
  } as unknown as Response;
}

function crearRequestAutenticado(
  idSesion: string,
): AuthenticatedSessionRequest {
  return {
    autenticacion: {
      sesion: { id_sesion: idSesion },
      usuario: {},
    },
  } as unknown as AuthenticatedSessionRequest;
}
