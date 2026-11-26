import { FlujoConversacionalNoEncontradoException } from '../../../domain/exceptions';
import {
  arbol,
  ids,
  repositorioSimulado,
} from '../../support/testing/arbol-fixtures';
import { ConsultarArbolConversacionalUseCase } from './consultar-arbol-conversacional.use-case';

describe('ConsultarArbolConversacionalUseCase (RF-25)', () => {
  const repository = repositorioSimulado();
  const useCase = new ConsultarArbolConversacionalUseCase(repository);

  beforeEach(() => jest.resetAllMocks());

  it('devuelve el flujo con sus nodos y transiciones', async () => {
    repository.obtenerArbol.mockResolvedValue(arbol());

    const respuesta = await useCase.execute(ids.flujo);

    expect(respuesta.flujo.id_flujo).toBe(ids.flujo);
    expect(respuesta.nodos).toHaveLength(2);
    expect(respuesta.transiciones[0]).toMatchObject({
      id_transicion: ids.transicion,
      regla_validacion: expect.objectContaining({
        id_regla_validacion: ids.regla,
      }),
    });
  });

  it('responde que el flujo no existe', async () => {
    repository.obtenerArbol.mockResolvedValue(null);

    await expect(useCase.execute(ids.flujo)).rejects.toBeInstanceOf(
      FlujoConversacionalNoEncontradoException,
    );
  });
});
