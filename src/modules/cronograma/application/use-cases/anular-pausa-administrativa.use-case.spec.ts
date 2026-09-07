import { PausaAdministrativa } from '../../domain/entities/pausa-administrativa.entity';
import { EstadoPausa } from '../../domain/enums/estado-pausa.enum';
import { AnulacionPausaAdministrativaException } from '../../domain/exeption/anulacion-pausa-administrativa.exception';
import { PausaAdministrativaNoEncontradaException } from '../../domain/exeption/pausa-administrativa-no-encontrada.exception';
import { PausaAdministrativaRepository } from '../../domain/repositories/pausa-administrativa.repository';
import { AnularPausaAdministrativaUseCase } from './anular-pausa-administrativa.use-case';

describe('AnularPausaAdministrativaUseCase (RF-22B)', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000001';
  const idPausa = '00000000-0000-4000-8000-000000000004';
  const repository: jest.Mocked<PausaAdministrativaRepository> = {
    buscarContextoCronogramaActivo: jest.fn(),
    existeSolapamiento: jest.fn(),
    crear: jest.fn(),
    listarPorUsuario: jest.fn(),
    anular: jest.fn(),
  };
  const useCase = new AnularPausaAdministrativaUseCase(repository);

  beforeEach(() => jest.clearAllMocks());

  it('permite anular una pausa pasada sin aplicar restricciones temporales', async () => {
    repository.anular.mockResolvedValue(crearPausa(EstadoPausa.ANULADA));

    await expect(useCase.execute(idUsuario, idPausa)).resolves.toMatchObject({
      id_pausa: idPausa,
      estado_pausa: EstadoPausa.ANULADA,
      mensaje: 'Pausa administrativa anulada correctamente.',
    });
    expect(repository.anular.mock.calls).toEqual([[idUsuario, idPausa]]);
  });

  it('es idempotente cuando el repositorio devuelve una pausa ya anulada', async () => {
    repository.anular.mockResolvedValue(crearPausa(EstadoPausa.ANULADA));

    await expect(useCase.execute(idUsuario, idPausa)).resolves.toMatchObject({
      estado_pausa: EstadoPausa.ANULADA,
    });
  });

  it('retorna 404 si la pausa no existe para el usuario', async () => {
    repository.anular.mockResolvedValue(null);

    await expect(useCase.execute(idUsuario, idPausa)).rejects.toBeInstanceOf(
      PausaAdministrativaNoEncontradaException,
    );
  });

  it('oculta los detalles de un error inesperado', async () => {
    repository.anular.mockRejectedValue(new Error('database unavailable'));

    await expect(useCase.execute(idUsuario, idPausa)).rejects.toBeInstanceOf(
      AnulacionPausaAdministrativaException,
    );
  });

  function crearPausa(estado: EstadoPausa): PausaAdministrativa {
    return new PausaAdministrativa(
      idPausa,
      idUsuario,
      '00000000-0000-4000-8000-000000000005',
      new Date('2026-08-01T12:00:00.000Z'),
      new Date('2026-08-02T12:00:00.000Z'),
      'Corrección administrativa',
      '00000000-0000-4000-8000-000000000002',
      new Date('2026-08-01T10:00:00.000Z'),
      estado,
    );
  }
});
