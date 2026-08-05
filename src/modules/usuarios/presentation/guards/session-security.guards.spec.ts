import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SessionConfig } from '../../application/ports/session-config';
import { SessionCookieConfig } from '../../application/ports/session-cookie-config';
import { SessionTokenHasher } from '../../application/ports/session-token-hasher';
import { Sesion } from '../../domain/entities/sesiones.entity';
import { Usuario } from '../../domain/entities/usuarios.entity';
import { AlcanceSesion } from '../../domain/enums/alcance-sesion.enum';
import { EstadoAplicacion } from '../../domain/enums/estado-aplicacion-enum';
import { EstadoCuenta } from '../../domain/enums/estado-cuenta';
import { EstadoRegistro } from '../../domain/enums/estado-registro.enum';
import { MotivoCierre } from '../../domain/enums/motivo-cierre-enum';
import { Rol } from '../../domain/enums/rol.enum';
import { SesionRepository } from '../../domain/repositories/sesion.repository';
import { UsuarioRepository } from '../../domain/repositories/user.repository';
import { CorreoElectronico } from '../../domain/value-objects/correo_electronico.vo';
import { ALCANCES_SESION_KEY } from '../decorators/alcances-sesion.decorator';
import type { AuthenticatedSessionRequest } from '../http/authenticated-session-request';
import { CsrfSessionGuard } from './csrf-session.guard';
import { SessionAuthGuard } from './session-auth.guard';
import { SessionScopeGuard } from './session-scope.guard';

describe('Seguridad HTTP de sesiones PWA', () => {
  let sesionRepository: jest.Mocked<SesionRepository>;
  let usuarioRepository: jest.Mocked<UsuarioRepository>;
  let sessionConfig: jest.Mocked<SessionConfig>;
  let cookieConfig: jest.Mocked<SessionCookieConfig>;
  let tokenHasher: jest.Mocked<SessionTokenHasher>;

  beforeEach(() => {
    sesionRepository = {
      crear: jest.fn(),
      buscarActivaPorTokenHash: jest.fn(),
      cerrarActiva: jest.fn(),
      registrarActividad: jest.fn(),
      actualizarCsrfToken: jest.fn(),
      expirarPorInactividad: jest.fn(),
      expirarPorSegundoPlano: jest.fn(),
    };
    usuarioRepository = {
      crear: jest.fn(),
      buscarPorCorreo: jest.fn(),
      buscarPorId: jest.fn(),
      actualizar: jest.fn(),
    };
    sessionConfig = {
      obtenerLimiteInactividadMinutos: jest.fn().mockReturnValue(15),
      obtenerLimiteSegundoPlanoMinutos: jest.fn().mockReturnValue(15),
    };
    cookieConfig = {
      obtenerNombreCookie: jest.fn().mockReturnValue('brisa_session'),
      esSegura: jest.fn().mockReturnValue(false),
      obtenerSameSite: jest.fn().mockReturnValue('lax'),
    };
    tokenHasher = {
      hash: jest.fn(async (valor: string) => `hash-${valor}`),
      compare: jest.fn(),
    };
  });

  describe('SessionAuthGuard', () => {
    it('autentica por cookie opaca, renueva actividad y adjunta el contexto', async () => {
      const request = crearRequest({ brisa_session: 'token-secreto' });
      const sesion = crearSesion();
      const usuario = crearUsuario();
      sesionRepository.buscarActivaPorTokenHash.mockResolvedValue(sesion);
      sesionRepository.registrarActividad.mockResolvedValue(true);
      usuarioRepository.buscarPorId.mockResolvedValue(usuario);

      await expect(
        crearAuthGuard().canActivate(crearContexto(request)),
      ).resolves.toBe(true);

      expect(tokenHasher.hash).toHaveBeenCalledWith('token-secreto');
      expect(sesionRepository.buscarActivaPorTokenHash).toHaveBeenCalledWith(
        'hash-token-secreto',
      );
      expect(request.autenticacion).toEqual({ sesion, usuario });
      expect(sesionRepository.registrarActividad).toHaveBeenCalledWith(
        sesion.id_sesion,
        expect.any(Date),
        EstadoAplicacion.ACTIVA,
      );
    });

    it('rechaza una solicitud sin la cookie de sesión', async () => {
      const request = crearRequest();

      await expect(
        crearAuthGuard().canActivate(crearContexto(request)),
      ).rejects.toMatchObject({ status: 401 });
      expect(sesionRepository.buscarActivaPorTokenHash).not.toHaveBeenCalled();
    });

    it('cierra y rechaza una sesión vencida antes de consultar al usuario', async () => {
      const request = crearRequest({ brisa_session: 'token-vencido' });
      const sesion = crearSesion({
        fechaUltimaInteraccion: new Date(Date.now() - 16 * 60_000),
      });
      sesionRepository.buscarActivaPorTokenHash.mockResolvedValue(sesion);
      sesionRepository.cerrarActiva.mockResolvedValue(true);

      await expect(
        crearAuthGuard().canActivate(crearContexto(request)),
      ).rejects.toMatchObject({ status: 401 });

      expect(sesionRepository.cerrarActiva).toHaveBeenCalledWith(
        sesion.id_sesion,
        expect.any(Date),
        MotivoCierre.INACTIVIDAD,
      );
      expect(usuarioRepository.buscarPorId).not.toHaveBeenCalled();
    });
  });

  describe('CsrfSessionGuard', () => {
    it('acepta únicamente el token CSRF asociado a la sesión autenticada', async () => {
      const request = crearRequest({}, 'csrf-cliente');
      request.autenticacion = {
        sesion: crearSesion(),
        usuario: crearUsuario(),
      };
      tokenHasher.compare.mockResolvedValue(true);

      await expect(
        new CsrfSessionGuard(tokenHasher).canActivate(crearContexto(request)),
      ).resolves.toBe(true);
      expect(tokenHasher.compare).toHaveBeenCalledWith(
        'csrf-cliente',
        'hash-csrf',
      );
    });

    it('rechaza un token CSRF inválido', async () => {
      const request = crearRequest({}, 'csrf-incorrecto');
      request.autenticacion = {
        sesion: crearSesion(),
        usuario: crearUsuario(),
      };
      tokenHasher.compare.mockResolvedValue(false);

      await expect(
        new CsrfSessionGuard(tokenHasher).canActivate(crearContexto(request)),
      ).rejects.toMatchObject({ status: 403 });
    });
  });

  describe('SessionScopeGuard', () => {
    it('impide usar una sesión limitada en un recurso de alcance completo', () => {
      const request = crearRequest();
      request.autenticacion = {
        sesion: crearSesion({ alcance: AlcanceSesion.LIMITADA }),
        usuario: crearUsuario(),
      };
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue([AlcanceSesion.COMPLETA]),
      } as unknown as Reflector;

      expect(() =>
        new SessionScopeGuard(reflector).canActivate(crearContexto(request)),
      ).toThrow(expect.objectContaining({ status: 403 }));
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        ALCANCES_SESION_KEY,
        expect.any(Array),
      );
    });
  });

  function crearAuthGuard(): SessionAuthGuard {
    return new SessionAuthGuard(
      sesionRepository,
      usuarioRepository,
      sessionConfig,
      cookieConfig,
      tokenHasher,
    );
  }
});

function crearContexto(
  request: Partial<AuthenticatedSessionRequest>,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: jest.fn(),
      getNext: jest.fn(),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;
}

function crearRequest(
  cookies: Record<string, string> = {},
  csrfToken?: string,
): Partial<AuthenticatedSessionRequest> & {
  autenticacion?: AuthenticatedSessionRequest['autenticacion'];
} {
  return {
    cookies,
    header: jest.fn((nombre: string) =>
      nombre.toLowerCase() === 'x-csrf-token' ? csrfToken : undefined,
    ),
  } as unknown as Partial<AuthenticatedSessionRequest> & {
    autenticacion?: AuthenticatedSessionRequest['autenticacion'];
  };
}

function crearSesion(
  datos: {
    alcance?: AlcanceSesion;
    fechaUltimaInteraccion?: Date;
  } = {},
): Sesion {
  return new Sesion(
    '00000000-0000-4000-8000-000000000010',
    '00000000-0000-4000-8000-000000000001',
    'hash-sesion',
    'hash-csrf',
    datos.alcance ?? AlcanceSesion.COMPLETA,
    new Date(),
    datos.fechaUltimaInteraccion ?? new Date(),
    15,
    EstadoAplicacion.ACTIVA,
    true,
    null,
    null,
  );
}

function crearUsuario(): Usuario {
  return new Usuario(
    '00000000-0000-4000-8000-000000000001',
    new CorreoElectronico('usuario@example.com'),
    'hash-seguro',
    Rol.ESTUDIANTE,
    EstadoRegistro.REGISTRO_COMPLETO,
    EstadoCuenta.ACTIVA,
    new Date(),
    new Date(),
    true,
    true,
    '00000000-0000-4000-8000-000000000002',
  );
}
