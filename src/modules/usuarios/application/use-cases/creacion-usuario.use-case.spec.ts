import { RegistroEstudiantePublisher } from '../ports/registro-estudiante.publisher';
import { Sesion } from '../../domain/entities/sesiones.entity';
import { AlcanceSesion } from '../../domain/enums/alcance-sesion.enum';
import { MotivoConsumo } from '../../domain/enums/motivo-consumo-enum';
import { NivelAcademico } from '../../domain/enums/nivel-academico-enum';
import { ConsentimientosRepository } from '../../domain/repositories/consetimientos.repository';
import { UsuarioRepository } from '../../domain/repositories/user.repository';
import { PasswordHasher } from '../ports/password-hasher';
import { SessionService } from '../services/sesion.service';
import { CreacionUsuarioUseCase } from './creacion-usuario.use-case';

type BoundMock<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? jest.Mock<R, A>
    : T[K];
};

function mockMethod<T extends (...args: never[]) => unknown>() {
  return jest.fn<ReturnType<T>, Parameters<T>>();
}

describe('CreacionUsuarioUseCase - mayoría de edad', () => {
  const registroPublisher: BoundMock<RegistroEstudiantePublisher> = {
    publicar: mockMethod<RegistroEstudiantePublisher['publicar']>(),
  };
  let usuarioRepository: BoundMock<UsuarioRepository>;
  let passwordHasher: BoundMock<PasswordHasher>;
  let consentimientosRepository: BoundMock<ConsentimientosRepository>;
  let sessionService: Pick<BoundMock<SessionService>, 'crearSesion'>;

  beforeEach(() => {
    registroPublisher.publicar.mockReset();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-28T12:00:00.000Z'));

    usuarioRepository = {
      crear: mockMethod<UsuarioRepository['crear']>(),
      buscarPorCorreo: mockMethod<UsuarioRepository['buscarPorCorreo']>(),
      buscarPorId: mockMethod<UsuarioRepository['buscarPorId']>(),
      actualizar: mockMethod<UsuarioRepository['actualizar']>(),
      crearAdministrador: mockMethod<UsuarioRepository['crearAdministrador']>(),
      buscarPorTermino: mockMethod<UsuarioRepository['buscarPorTermino']>(),
      actualizarConsentimientoYEstado:
        mockMethod<UsuarioRepository['actualizarConsentimientoYEstado']>(),
    };
    passwordHasher = {
      hash: mockMethod<PasswordHasher['hash']>(),
      compare: mockMethod<PasswordHasher['compare']>(),
    };
    consentimientosRepository = {
      buscarPorId: mockMethod<ConsentimientosRepository['buscarPorId']>(),
      findVigentes: mockMethod<ConsentimientosRepository['findVigentes']>(),
      obtenerIdConsitimientoVigente:
        mockMethod<
          ConsentimientosRepository['obtenerIdConsitimientoVigente']
        >(),
    };
    sessionService = {
      crearSesion: mockMethod<SessionService['crearSesion']>(),
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('detiene el registro de un menor antes de ejecutar efectos externos', async () => {
    const casoUso = new CreacionUsuarioUseCase(
      usuarioRepository,
      passwordHasher,
      consentimientosRepository,
      sessionService as unknown as SessionService,
      registroPublisher,
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
    expect(registroPublisher.publicar).not.toHaveBeenCalled();
  });

  it('persiste el flujo completo de un adulto con la fecha normalizada', async () => {
    passwordHasher.hash.mockResolvedValue('hash-seguro');
    usuarioRepository.buscarPorCorreo.mockResolvedValue(null);
    consentimientosRepository.obtenerIdConsitimientoVigente.mockResolvedValue(
      '00000000-0000-4000-8000-000000000010',
    );
    sessionService.crearSesion.mockImplementation((idUsuario) =>
      Promise.resolve({
        sesion: Sesion.iniciar(
          idUsuario,
          'hash-token-sesion',
          'hash-token-csrf',
          AlcanceSesion.COMPLETA,
          15,
        ),
        tokenSesion: 'token-sesion',
        csrfToken: 'token-csrf',
      }),
    );

    const casoUso = new CreacionUsuarioUseCase(
      usuarioRepository,
      passwordHasher,
      consentimientosRepository,
      sessionService as unknown as SessionService,
      registroPublisher,
    );

    await casoUso.execute(crearDto(new Date('2008-08-28T18:45:00.000Z')));

    expect(sessionService.crearSesion).toHaveBeenCalledWith(
      expect.any(String),
      AlcanceSesion.COMPLETA,
    );
    expect(usuarioRepository.crear).toHaveBeenCalledTimes(1);

    expect(registroPublisher.publicar).toHaveBeenCalledTimes(1);
    expect(usuarioRepository.crear.mock.invocationCallOrder[0]).toBeLessThan(
      registroPublisher.publicar.mock.invocationCallOrder[0],
    );
    const [usuario, lineaBase, sesion] = usuarioRepository.crear.mock.calls[0];
    expect(registroPublisher.publicar).toHaveBeenCalledWith(usuario.id_usuario);
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
