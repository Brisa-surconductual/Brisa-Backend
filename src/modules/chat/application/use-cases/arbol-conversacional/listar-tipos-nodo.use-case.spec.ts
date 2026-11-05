import { TipoNodoConversacional } from '../../../domain/entities/catalogos/tipo-nodo.entity';
import { ids, repositorioSimulado } from '../../support/testing/arbol-fixtures';
import { ListarTiposNodoUseCase } from './listar-tipos-nodo.use-case';

describe('ListarTiposNodoUseCase (RF-25)', () => {
  const repository = repositorioSimulado();
  const useCase = new ListarTiposNodoUseCase(repository);

  it('lista los tipos de nodo con el contrato HTTP', async () => {
    repository.listarTiposNodo.mockResolvedValue([
      new TipoNodoConversacional(ids.tipo, 'MENSAJE'),
    ]);

    await expect(useCase.execute()).resolves.toEqual([
      { id_tipo_nodo: ids.tipo, nombre: 'MENSAJE' },
    ]);
  });
});
