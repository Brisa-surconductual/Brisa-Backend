import { BadRequestException } from '@nestjs/common';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import {
  flujoGrupal,
  repositorioSimulado,
} from '../../support/testing/arbol-fixtures';
import { ListarFlujosUseCase } from './listar-flujos.use-case';

describe('ListarFlujosUseCase (RF-25 / RF-25C)', () => {
  const repository = repositorioSimulado();
  const useCase = new ListarFlujosUseCase(repository);

  beforeEach(() => jest.resetAllMocks());

  it('traduce los filtros y devuelve items con metadatos de paginación', async () => {
    repository.listarFlujos.mockResolvedValue({
      items: [flujoGrupal()],
      total: 8,
    });

    const respuesta = await useCase.execute({
      modalidad: ModalidadConversacional.GRUPAL,
      page: 2,
      page_size: 5,
    });

    expect(repository.listarFlujos).toHaveBeenCalledWith(
      expect.objectContaining({ modalidad: ModalidadConversacional.GRUPAL }),
      2,
      5,
    );
    expect(respuesta.meta).toEqual({ page: 2, page_size: 5, total: 8 });
    expect(respuesta.data.items).toHaveLength(1);
  });

  it('rechaza una paginación que excede el rango seguro', () => {
    expect(() =>
      useCase.execute({ page: Number.MAX_SAFE_INTEGER, page_size: 100 }),
    ).toThrow(BadRequestException);
    expect(repository.listarFlujos).not.toHaveBeenCalled();
  });
});
