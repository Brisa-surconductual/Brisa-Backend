import { Usuario } from '../../domain/entities/usuarios.entity';
import { EstadoCuenta } from '../../domain/enums/estado-cuenta';
import { EstadoRegistro } from '../../domain/enums/estado-registro.enum';
import { MotivoCierre } from '../../domain/enums/motivo-cierre-enum';
import { Rol } from '../../domain/enums/rol.enum';
import { AlcanceSesion } from '../../domain/enums/alcance-sesion.enum';
import { CorreoElectronico } from '../../domain/value-objects/correo_electronico.vo';
import { UsuarioRepository } from '../../domain/repositories/user.repository';
import { SesionRepository } from '../../domain/repositories/sesion.repository';
import { PasswordHasher } from '../ports/password-hasher';
import { SessionConfig } from '../ports/session-config';
import { SessionTokenGenerator } from '../ports/session-token-generator';
import { SessionTokenHasher } from '../ports/session-token-hasher';
import { EstadoAplicacionDto } from '../dto/registrar-actividad-sesion.dto-request';
import { IniciarSesionUseCase } from './iniciar-sesion.use-case';
import { CerrarSesionUseCase } from './cerrar-sesion.use-case';
import { RegistrarActividadSesionUseCase } from './registrar-actividad-sesion.use-case';
import { ExpirarSesionesUseCase } from './expirar-sesiones.use-case';
import { RenovarCsrfSesionUseCase } from './renovar-csrf-sesion.use-case';

describe('Casos de uso de sesiones PWA', () => {
  let usuarioRepository: jest.Mocked<UsuarioRepository>;
  let sesionRepository: jest.Mocked<SesionRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;
  let sessionConfig: jest.Mocked<SessionConfig>;
  let tokenGenerator: jest.Mocked<SessionTokenGenerator>;
  let tokenHasher: jest.Mocked<SessionTokenHasher>;

  beforeEach(() => {
    usuarioRepository = {
      crear: jest.fn(),
      buscarPorCorreo: jest.fn(),
      buscarPorId: jest.fn(),
      actualizar: jest.fn(),
    };
    sesionRepository = {
      crear: jest.fn(),
      buscarActivaPorTokenHash: jest.fn(),
      cerrarActiva: jest.fn(),
      registrarActividad: jest.fn(),
      actualizarCsrfToken: jest.fn(),
      expirarPorInactividad: jest.fn(),
      expirarPorSegundoPlano: jest.fn(),
    };
    passwordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };
    sessionConfig = {
      obtenerLimiteInactividadMinutos: jest.fn().mockReturnValue(15),
      obtenerLimiteSegundoPlanoMinutos: jest.fn().mockReturnValue(10),
    };
    tokenGenerator = {
      generarToken: jest
        .fn()
        .mockReturnValueOnce('token-sesion')
        .mockReturnValueOnce('token-csrf'),
    };
    tokenHasher = {
      hash: jest.fn(async (token: string) => `hash-${token}`),
      compare: jest.fn(),
    };
  });

  describe('IniciarSesionUseCase', () => {
    it('crea una sesión limitada con hashes y sin exponer el token de sesión', async () => {
      usuarioRepository.buscarPorCorreo.mockResolvedValue(
        crearUsuario(EstadoRegistro.PENDIENTE_CONSENTIMIENTO),
      );
      passwordHasher.compare.mockResolvedValue(true);
      const useCase = crearCasoInicio();

      const resultado = await useCase.execute({
        correoElectronico: '  USUARIO@EXAMPLE.COM ',
        contrasena: 'Segura1!',
      });

      expect(resultado.tokenSesion).toBe('token-sesion');
      expect(resultado.respuesta.alcance).toBe(AlcanceSesion.LIMITADA);
      expect(resultado.respuesta.csrfToken).toBe('token-csrf');
      expect(resultado.respuesta).not.toHaveProperty('idSesion');
      expect(sesionRepository.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          token_hash: 'hash-token-sesion',
          csrf_token_hash: 'hash-token-csrf',
          alcance_sesion: AlcanceSesion.LIMITADA,
          activa: true,
        }),
      );
    });

    it('crea una sesión completa para un registro finalizado', async () => {
      usuarioRepository.buscarPorCorreo.mockResolvedValue(
        crearUsuario(EstadoRegistro.REGISTRO_COMPLETO),
      );
      passwordHasher.compare.mockResolvedValue(true);

      const resultado = await crearCasoInicio().execute({
        correoElectronico: 'usuario@example.com',
        contrasena: 'Segura1!',
      });

      expect(resultado.respuesta.alcance).toBe(AlcanceSesion.COMPLETA);
      expect(resultado.respuesta.siguienteAccion).toBe('INGRESAR');
    });

    it('no crea sesión cuando la contraseña es incorrecta', async () => {
      usuarioRepository.buscarPorCorreo.mockResolvedValue(
        crearUsuario(EstadoRegistro.REGISTRO_COMPLETO),
      );
      passwordHasher.compare.mockResolvedValue(false);

      await expect(
        crearCasoInicio().execute({
          correoElectronico: 'usuario@example.com',
          contrasena: 'incorrecta',
        }),
      ).rejects.toMatchObject({ status: 401 });
      expect(sesionRepository.crear).not.toHaveBeenCalled();
    });

    it('realiza una comparación bcrypt aunque el correo no exista', async () => {
      usuarioRepository.buscarPorCorreo.mockResolvedValue(null);
      passwordHasher.compare.mockResolvedValue(false);

      await expect(
        crearCasoInicio().execute({
          correoElectronico: 'inexistente@example.com',
          contrasena: 'Segura1!',
        }),
      ).rejects.toMatchObject({ status: 401 });
      expect(passwordHasher.compare).toHaveBeenCalledWith(
        'Segura1!',
        expect.stringMatching(/^\$2b\$12\$/),
      );
    });
  });

  describe('CerrarSesionUseCase', () => {
    it('invalida la sesión identificada por el guard', async () => {
      sesionRepository.cerrarActiva.mockResolvedValue(true);
      const useCase = new CerrarSesionUseCase(sesionRepository);

      const respuesta = await useCase.execute('sesion-id');

      expect(respuesta.mensaje).toContain('cerró correctamente');
      expect(sesionRepository.cerrarActiva).toHaveBeenCalledWith(
        'sesion-id',
        expect.any(Date),
        MotivoCierre.VOLUNTARIO,
      );
    });

    it('rechaza una carrera donde la sesión ya fue cerrada', async () => {
      sesionRepository.cerrarActiva.mockResolvedValue(false);

      await expect(
        new CerrarSesionUseCase(sesionRepository).execute('sesion-id'),
      ).rejects.toMatchObject({ status: 401 });
    });
  });

  describe('RegistrarActividadSesionUseCase', () => {
    it('registra segundo plano sin recibir idSesion en el DTO', async () => {
      sesionRepository.registrarActividad.mockResolvedValue(true);
      const useCase = new RegistrarActividadSesionUseCase(sesionRepository);

      const respuesta = await useCase.execute('sesion-id', {
        estadoAplicacion: EstadoAplicacionDto.SEGUNDO_PLANO,
      });

      expect(respuesta.estadoAplicacion).toBe('SEGUNDO_PLANO');
      expect(respuesta).not.toHaveProperty('idSesion');
    });
  });

  describe('RenovarCsrfSesionUseCase', () => {
    it('rota el CSRF y persiste solamente su hash', async () => {
      tokenGenerator.generarToken.mockReset().mockReturnValue('csrf-renovado');
      sesionRepository.actualizarCsrfToken.mockResolvedValue(true);
      const useCase = new RenovarCsrfSesionUseCase(
        sesionRepository,
        tokenGenerator,
        tokenHasher,
      );

      await expect(useCase.execute('sesion-id')).resolves.toBe('csrf-renovado');
      expect(sesionRepository.actualizarCsrfToken).toHaveBeenCalledWith(
        'sesion-id',
        'hash-csrf-renovado',
      );
    });
  });

  describe('ExpirarSesionesUseCase', () => {
    it('expira por separado inactividad y segundo plano', async () => {
      sesionRepository.expirarPorInactividad.mockResolvedValue(2);
      sesionRepository.expirarPorSegundoPlano.mockResolvedValue(1);
      const ahora = new Date('2026-08-03T15:00:00.000Z');
      const resultado = await new ExpirarSesionesUseCase(
        sesionRepository,
        sessionConfig,
      ).execute(ahora);

      expect(resultado).toEqual({ inactividad: 2, segundoPlano: 1 });
      expect(sesionRepository.expirarPorInactividad).toHaveBeenCalledWith(
        new Date('2026-08-03T14:45:00.000Z'),
        ahora,
      );
    });
  });

  function crearCasoInicio(): IniciarSesionUseCase {
    return new IniciarSesionUseCase(
      usuarioRepository,
      sesionRepository,
      passwordHasher,
      sessionConfig,
      tokenGenerator,
      tokenHasher,
    );
  }
});

function crearUsuario(estadoRegistro: EstadoRegistro): Usuario {
  return new Usuario(
    '00000000-0000-4000-8000-000000000001',
    new CorreoElectronico('usuario@example.com'),
    'hash-seguro',
    Rol.ESTUDIANTE,
    estadoRegistro,
    EstadoCuenta.ACTIVA,
    new Date('2026-08-01T00:00:00.000Z'),
    new Date('2026-08-01T00:00:00.000Z'),
    true,
    true,
    '00000000-0000-4000-8000-000000000002',
  );
}
