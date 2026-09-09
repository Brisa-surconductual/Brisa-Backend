import { PausaAdministrativa } from '../../../domain/entities/pausa-administrativa.entity';
import { EstadoPausa } from '../../../domain/enums/estado-pausa.enum';
import { ConsultaPausasAdministrativasException } from '../../../domain/exeption/pausa-administrativa/consulta-pausas-administrativas.exception';
import { PausaAdministrativaRepository } from '../../../domain/repositories/pausa-administrativa.repository';
import { ConsultarPausasAdministrativasUsuarioUseCase } from './consultar-pausas-administrativas-usuario.use-case';

describe('ConsultarPausasAdministrativasUsuarioUseCase (RF-22B)', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000001';
  const repository: jest.Mocked<PausaAdministrativaRepository> = {
    buscarContextoCronogramaActivo: jest.fn(),
    existeSolapamiento: jest.fn(),
    crear: jest.fn(),
    listarPorUsuario: jest.fn(),
    anular: jest.fn(),
  };
  const useCase = new ConsultarPausasAdministrativasUsuarioUseCase(repository);

  beforeEach(() => jest.clearAllMocks());

  it('lista el historial con el estado entregado por la BD', async () => {
    const fechaConsulta = new Date('2026-09-15T12:00:00.000Z');
    repository.listarPorUsuario.mockResolvedValue([
      crearPausa(EstadoPausa.ACTIVA),
      crearPausa(EstadoPausa.FINALIZADA),
      crearPausa(EstadoPausa.ANULADA),
    ]);

    await expect(useCase.execute(idUsuario, fechaConsulta)).resolves.toEqual([
      expect.objectContaining({ estado_pausa: EstadoPausa.ACTIVA }),
      expect.objectContaining({ estado_pausa: EstadoPausa.FINALIZADA }),
      expect.objectContaining({ estado_pausa: EstadoPausa.ANULADA }),
    ]);
    expect(repository.listarPorUsuario.mock.calls).toEqual([
      [idUsuario, fechaConsulta],
    ]);
  });

  it('retorna una lista vacía cuando el usuario no tiene pausas', async () => {
    repository.listarPorUsuario.mockResolvedValue([]);

    await expect(useCase.execute(idUsuario)).resolves.toEqual([]);
  });

  it('oculta los detalles de un error inesperado', async () => {
    repository.listarPorUsuario.mockRejectedValue(
      new Error('database unavailable'),
    );

    await expect(useCase.execute(idUsuario)).rejects.toBeInstanceOf(
      ConsultaPausasAdministrativasException,
    );
  });

  function crearPausa(estado: EstadoPausa): PausaAdministrativa {
    return new PausaAdministrativa(
      '00000000-0000-4000-8000-000000000004',
      idUsuario,
      '00000000-0000-4000-8000-000000000005',
      new Date('2026-09-10T12:00:00.000Z'),
      new Date('2026-09-12T12:00:00.000Z'),
      'Decisión administrativa',
      '00000000-0000-4000-8000-000000000002',
      new Date('2026-09-07T12:00:00.000Z'),
      estado,
    );
  }
});
