import { Sesion } from '../../domain/entities/sesiones.entity';
import { AlcanceSesion } from '../../domain/enums/alcance-sesion.enum';
import { MotivoConsumo } from '../../domain/enums/motivo-consumo-enum';
import { NivelAcademico } from '../../domain/enums/nivel-academico-enum';
import { ConsentimientosRepository } from '../../domain/repositories/consetimientos.repository';
import { UsuarioRepository } from '../../domain/repositories/user.repository';
import { PasswordHasher } from '../ports/password-hasher';
import { SessionService } from '../services/sesion.service';
import { CreacionUsuarioUseCase } from './creacion-usuario.use-case';

describe('CreacionUsuarioUseCase - mayoría de edad', () => {
  let usuarioRepository: jest.Mocked<UsuarioRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;
  let consentimientosRepository: jest.Mocked<ConsentimientosRepository>;
  let sessionService: jest.Mocked<SessionService>;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-28T12:00:00.000Z'));

    usuarioRepository = {
      crear: jest.fn(),
      buscarPorCorreo: jest.fn(),
      buscarPorId: jest.fn(),
      actualizar: jest.fn(),
      crearAdministrador: jest.fn(),
    };
    passwordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };
    consentimientosRepository = {
      obtenerIdConsitimientoVigente: jest.fn(),
    };
    sessionService = {
      crearSesion: jest.fn(),
    } as unknown as jest.Mocked<SessionService>;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('detiene el registro de un menor antes de ejecutar efectos externos', async () => {
    const casoUso = new CreacionUsuarioUseCase(
      usuarioRepository,
      passwordHasher,
      consentimientosRepository,
      sessionService,
    );

    await expect(
      casoUso.execute(crearDto(new Date('2008-08-29T00:00:00.000Z'))),
    ).rejects.toMatchObject({ status: 400 });

    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(usuarioRepository.buscarPorCorreo).not.toHaveBeenCalled();
    expect(
      consentimientosRepository.obtenerIdConsitimientoVigente,
    ).not.toHaveBeenCalled();
    expect(sessionService.crearSesion).not.toHaveBeenCalled();
    expect(usuarioRepository.crear).not.toHaveBeenCalled();
  });

  it('persiste el flujo completo de un adulto con la fecha normalizada', async () => {
    passwordHasher.hash.mockResolvedValue('hash-seguro');
    usuarioRepository.buscarPorCorreo.mockResolvedValue(null);
    consentimientosRepository.obtenerIdConsitimientoVigente.mockResolvedValue(
      '00000000-0000-4000-8000-000000000010',
    );
    sessionService.crearSesion.mockImplementation(async (idUsuario) => ({
      sesion: Sesion.iniciar(
        idUsuario,
        'hash-token-sesion',
        'hash-token-csrf',
        AlcanceSesion.COMPLETA,
        15,
      ),
      tokenSesion: 'token-sesion',
      csrfToken: 'token-csrf',
    }));

    const casoUso = new CreacionUsuarioUseCase(
      usuarioRepository,
      passwordHasher,
      consentimientosRepository,
      sessionService,
    );

    await casoUso.execute(crearDto(new Date('2008-08-28T18:45:00.000Z')));

    expect(sessionService.crearSesion).toHaveBeenCalledWith(
      expect.any(String),
      AlcanceSesion.COMPLETA,
    );
    expect(usuarioRepository.crear).toHaveBeenCalledTimes(1);

    const [usuario, lineaBase, sesion] = usuarioRepository.crear.mock.calls[0];
    expect(lineaBase.id_usuario).toBe(usuario.id_usuario);
    expect(sesion.id_usuario).toBe(usuario.id_usuario);
    expect(lineaBase.fechaNacimiento).toEqual(
      new Date('2008-08-28T00:00:00.000Z'),
    );
  });

  function crearDto(fechaNacimiento: Date) {
    return {
      correoElectronico: 'estudiante@example.com',
      contrasena: 'Segura123!',
      fechaNacimiento,
      ciudad: 'Bogotá',
      entidad_educativa: 'Universidad de prueba',
      programa_academico: 'Ingeniería de Sistemas',
      semestre: 5,
      nivelAcademico: NivelAcademico.PREGRADO,
      fechaInicioConsumo: new Date('2025-01-01T00:00:00.000Z'),
      fechaUltimoConsumo: new Date('2026-01-01T00:00:00.000Z'),
      motivoInicioConsumo: MotivoConsumo.CURIOSIDAD,
      frecuenciaConsumo: 2,
    };
  }
});
