import { ArbolConversacional } from '../../../domain/entities/flujo/arbol-conversacional.entity';
import {
  FlujoConversacionalNoEncontradoException,
  NodoInicialInexistenteException,
} from '../../../domain/exceptions';
import {
  arbol,
  flujoGrupal,
  ids,
  nodo,
  repositorioSimulado,
} from '../../support/testing/arbol-fixtures';
import { ValidarArbolConversacionalUseCase } from './validar-arbol-conversacional.use-case';

describe('ValidarArbolConversacionalUseCase (RF-25 / RF-25C)', () => {
  const repository = repositorioSimulado();
  const useCase = new ValidarArbolConversacionalUseCase(repository);

  beforeEach(() => jest.resetAllMocks());

  it('confirma un árbol con nodo inicial, sin ciclos ni huérfanos', async () => {
    repository.obtenerArbol.mockResolvedValue(arbol());

    await expect(useCase.execute(ids.flujo)).resolves.toEqual({
      valido: true,
      total_nodos: 2,
      total_transiciones: 1,
    });
  });

  it('rechaza un árbol sin nodo inicial', async () => {
    repository.obtenerArbol.mockResolvedValue(
      new ArbolConversacional(flujoGrupal(), [nodo(ids.nodoB)], []),
    );

    await expect(useCase.execute(ids.flujo)).rejects.toBeInstanceOf(
      NodoInicialInexistenteException,
    );
  });

  it('responde que el flujo no existe', async () => {
    repository.obtenerArbol.mockResolvedValue(null);

    await expect(useCase.execute(ids.flujo)).rejects.toBeInstanceOf(
      FlujoConversacionalNoEncontradoException,
    );
  });
});
