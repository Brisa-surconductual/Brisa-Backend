import { CondicionesInicializacionUsuario } from '../../domain/entities/condiciones-inicializacion-usuario.entity';
import { Cronograma } from '../../domain/entities/cronograma.entity';
import { CronogramaUsuario } from '../../domain/entities/cronograma-usuario.entity';
import { EstadoCronograma } from '../../domain/enums/estado-cronograma.enum';
import { CronogramaUsuarioYaInicializadoException } from '../../domain/exeption/cronograma-usuario-ya-inicializado.exception';
import { CondicionesInicializacionUsuarioRepository } from '../../domain/repositories/condiciones-inicializacion-usuario.repository';
import { CronogramaRepository } from '../../domain/repositories/cronograma.repository';
import { CronogramaUsuarioRepository } from '../../domain/repositories/cronograma-usuario.repository';
import { EstadoRegistro } from '../../../usuarios/domain/enums/estado-registro.enum';
import { Rol } from '../../../usuarios/domain/enums/rol.enum';
import { InicializarCronogramaUsuarioUseCase } from './inicializar-cronograma-usuario.use-case';

describe('InicializarCronogramaUsuarioUseCase (RF-17)', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000001';
  const idCronograma = '00000000-0000-4000-8000-000000000002';
  const ahora = new Date('2026-08-14T15:00:00.000Z');

  let condicionesRepository: jest.Mocked<CondicionesInicializacionUsuarioRepository>;
  let cronogramaRepository: jest.Mocked<CronogramaRepository>;
  let cronogramaUsuarioRepository: jest.Mocked<CronogramaUsuarioRepository>;
  let useCase: InicializarCronogramaUsuarioUseCase;

  beforeEach(() => {
    condicionesRepository = {
      buscarPorUsuario: jest.fn().mockResolvedValue(condicionesCompletas()),
      buscarUsuariosElegiblesSinCronograma: jest.fn(),
    };
    cronogramaRepository = {
      buscarBaseActiva: jest.fn().mockResolvedValue(cronogramaBaseActivo()),
      existeBaseConfigurado: jest.fn(),
    };
    cronogramaUsuarioRepository = {
      buscarPorUsuario: jest.fn().mockResolvedValue(null),
      crear: jest.fn(),
    };
    useCase = new InicializarCronogramaUsuarioUseCase(
      condicionesRepository,
      cronogramaRepository,
      cronogramaUsuarioRepository,
    );
  });

  it('asigna el cronograma base activo y registra la fecha de inicio', async () => {
    const resultado = await useCase.execute(idUsuario, ahora);

    expect(resultado).toMatchObject({
      cronograma_asignado: {
        id_cronograma: idCronograma,
        estado: EstadoCronograma.ACTIVO,
      },
      fecha_inicio_usuario: ahora,
      estado_operacion: 'INICIALIZADO',
    });
    expect(cronogramaUsuarioRepository.crear.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        id_usuario: idUsuario,
        id_cronograma: idCronograma,
        fecha_inicio_usuario: ahora,
      }),
    );
  });

  it.each([
    [
      'registro incompleto',
      condicionesCompletas({
        estadoRegistro: EstadoRegistro.PENDIENTE_REVISION,
      }),
    ],
    [
      'consentimiento no aceptado',
      condicionesCompletas({ consentimientoAceptado: false }),
    ],
    [
      'línea base no capturada',
      condicionesCompletas({ lineaBaseCapturada: false }),
    ],
  ])('retorna 400 cuando falta %s', async (_, condiciones) => {
    condicionesRepository.buscarPorUsuario.mockResolvedValue(condiciones);

    await expect(useCase.execute(idUsuario, ahora)).rejects.toMatchObject({
      status: 400,
    });
    expect(cronogramaUsuarioRepository.crear.mock.calls).toHaveLength(0);
  });

  it('retorna 422 cuando el usuario no existe', async () => {
    condicionesRepository.buscarPorUsuario.mockResolvedValue(null);

    await expect(useCase.execute(idUsuario, ahora)).rejects.toMatchObject({
      status: 422,
    });
  });

  it('retorna 422 cuando el consentimiento aceptado no tiene respaldo', async () => {
    condicionesRepository.buscarPorUsuario.mockResolvedValue(
      condicionesCompletas({ idConsentimiento: null }),
    );

    await expect(useCase.execute(idUsuario, ahora)).rejects.toMatchObject({
      status: 422,
    });
  });

  it('retorna 409 cuando el usuario ya tiene cronograma', async () => {
    cronogramaUsuarioRepository.buscarPorUsuario.mockResolvedValue(
      CronogramaUsuario.inicializar(idUsuario, idCronograma, ahora),
    );

    await expect(useCase.execute(idUsuario, ahora)).rejects.toMatchObject({
      status: 409,
      message: 'El usuario ya tiene un cronograma inicializado.',
    });
    expect(cronogramaUsuarioRepository.crear.mock.calls).toHaveLength(0);
  });

  it('retorna 409 cuando solamente hay un cronograma base inactivo', async () => {
    cronogramaRepository.buscarBaseActiva.mockResolvedValue(null);
    cronogramaRepository.existeBaseConfigurado.mockResolvedValue(true);

    await expect(useCase.execute(idUsuario, ahora)).rejects.toMatchObject({
      status: 409,
      message:
        'No es posible inicializar el cronograma porque no se encuentra activo.',
    });
  });

  it('retorna 404 cuando no existe un cronograma base configurado', async () => {
    cronogramaRepository.buscarBaseActiva.mockResolvedValue(null);
    cronogramaRepository.existeBaseConfigurado.mockResolvedValue(false);

    await expect(useCase.execute(idUsuario, ahora)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('conserva el 409 si la restricción única detecta una carrera', async () => {
    cronogramaUsuarioRepository.crear.mockRejectedValue(
      new CronogramaUsuarioYaInicializadoException(),
    );

    await expect(useCase.execute(idUsuario, ahora)).rejects.toMatchObject({
      status: 409,
    });
  });

  it('retorna 500 ante un fallo inesperado de persistencia', async () => {
    cronogramaUsuarioRepository.crear.mockRejectedValue(
      new Error('database unavailable'),
    );

    await expect(useCase.execute(idUsuario, ahora)).rejects.toMatchObject({
      status: 500,
      message:
        'No fue posible inicializar el cronograma en este momento. Intente nuevamente más tarde.',
    });
  });

  function condicionesCompletas(
    cambios: Partial<{
      estadoRegistro: EstadoRegistro;
      consentimientoAceptado: boolean | null;
      idConsentimiento: string | null;
      lineaBaseCapturada: boolean;
    }> = {},
  ): CondicionesInicializacionUsuario {
    return new CondicionesInicializacionUsuario(
      idUsuario,
      Rol.ESTUDIANTE,
      cambios.estadoRegistro ?? EstadoRegistro.REGISTRO_COMPLETO,
      cambios.consentimientoAceptado ?? true,
      cambios.idConsentimiento === undefined
        ? '00000000-0000-4000-8000-000000000003'
        : cambios.idConsentimiento,
      cambios.lineaBaseCapturada ?? true,
    );
  }

  function cronogramaBaseActivo(): Cronograma {
    return new Cronograma(
      idCronograma,
      'Cronograma base 2026',
      EstadoCronograma.ACTIVO,
      true,
      new Date('2026-08-01T00:00:00.000Z'),
      new Date('2026-07-01T00:00:00.000Z'),
      new Date('2026-08-01T00:00:00.000Z'),
    );
  }
});
