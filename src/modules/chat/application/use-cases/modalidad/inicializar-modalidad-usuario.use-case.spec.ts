import { AsignacionModalidad } from '../../../domain/entities/modalidad/asignacion-modalidad.entity';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import { ModalidadUsuarioYaInicializadaException } from '../../../domain/exceptions';
import { ModalidadProgramaRepository } from '../../../domain/repositories/modalidad-programa.repository';
import { InicializarModalidadUsuarioUseCase } from './inicializar-modalidad-usuario.use-case';

describe('InicializarModalidadUsuarioUseCase', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000001';
  const ahora = new Date('2026-11-15T00:00:00.000Z');

  const existeAsignacionVigente = jest.fn();
  const guardarAsignaciones = jest.fn();

  const modalidades = {
    existeAsignacionVigente,
    guardarAsignaciones,
  } as unknown as ModalidadProgramaRepository;

  const useCase = new InicializarModalidadUsuarioUseCase(modalidades);

  beforeEach(() => {
    existeAsignacionVigente.mockReset();
    guardarAsignaciones.mockReset();
  });

  it('crea la asignación GRUPAL inicial del estudiante', async () => {
    existeAsignacionVigente.mockResolvedValue(false);

    await useCase.execute(idUsuario, ahora);

    expect(guardarAsignaciones).toHaveBeenCalledTimes(1);
    const [asignaciones] = guardarAsignaciones.mock.calls[0] as [
      AsignacionModalidad[],
    ];
    expect(asignaciones).toHaveLength(1);
    expect(asignaciones[0]).toMatchObject({
      idUsuario,
      modalidad: ModalidadConversacional.GRUPAL,
      fechaVigenciaDesde: ahora,
      fechaVigenciaHasta: null,
    });
  });

  it('no hace nada si el usuario ya tiene una modalidad vigente', async () => {
    existeAsignacionVigente.mockResolvedValue(true);

    await expect(useCase.execute(idUsuario, ahora)).rejects.toBeInstanceOf(
      ModalidadUsuarioYaInicializadaException,
    );

    expect(guardarAsignaciones).not.toHaveBeenCalled();
  });
});
