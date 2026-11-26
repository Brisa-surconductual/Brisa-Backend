import {
  EliminacionArbolPersonalizadoProhibidaException,
  FlujoPersonalizadoNoEncontradoException,
} from '../../../domain/exceptions';
import {
  flujoGrupal,
  flujoPersonalizado,
  ids,
  repositorioSimulado,
} from '../../support/testing/arbol-fixtures';
import { RechazarEliminacionArbolPersonalizadoUseCase } from './rechazar-eliminacion-arbol-personalizado.use-case';

describe('RechazarEliminacionArbolPersonalizadoUseCase (RF-25C)', () => {
  const repository = repositorioSimulado();
  const useCase = new RechazarEliminacionArbolPersonalizadoUseCase(repository);

  beforeEach(() => jest.resetAllMocks());

  it('prohíbe la eliminación física de un árbol personalizado existente', async () => {
    repository.obtenerFlujo.mockResolvedValue(flujoPersonalizado());

    await expect(useCase.execute(ids.flujo)).rejects.toBeInstanceOf(
      EliminacionArbolPersonalizadoProhibidaException,
    );
  });

  it('no revela un árbol grupal a través del endpoint personalizado', async () => {
    repository.obtenerFlujo.mockResolvedValue(flujoGrupal());

    await expect(useCase.execute(ids.flujo)).rejects.toBeInstanceOf(
      FlujoPersonalizadoNoEncontradoException,
    );
  });

  it('responde que el árbol no existe', async () => {
    repository.obtenerFlujo.mockResolvedValue(null);

    await expect(useCase.execute(ids.flujo)).rejects.toBeInstanceOf(
      FlujoPersonalizadoNoEncontradoException,
    );
  });
});
