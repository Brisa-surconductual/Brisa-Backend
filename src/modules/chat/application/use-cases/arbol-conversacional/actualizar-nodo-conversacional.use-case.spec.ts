import { ArbolConversacional } from '../../../domain/entities/flujo/arbol-conversacional.entity';
import { EstadoFlujoConversacional } from '../../../domain/enums/estado-flujo-conversacional.enum';
import {
  ContenidoCronogramaNoEncontradoException,
  FlujoConversacionalNoEditableException,
  NodoConversacionalNoEncontradoException,
  OrdenNodoConSaltoException,
  OrdenNodoDuplicadoException,
  OrdenNodoInicialInvalidoException,
} from '../../../domain/exceptions';
import { SolicitudActualizacionVaciaException } from '../../exceptions/solicitud-actualizacion-vacia.exception';
import {
  flujoGrupal,
  ids,
  nodo,
  repositorioSimulado,
} from '../../support/testing/arbol-fixtures';
import { ActualizarNodoConversacionalUseCase } from './actualizar-nodo-conversacional.use-case';

describe('ActualizarNodoConversacionalUseCase (RF-25)', () => {
  const repository = repositorioSimulado();
  const useCase = new ActualizarNodoConversacionalUseCase(repository);

  beforeEach(() => {
    jest.resetAllMocks();
    repository.buscarNodo.mockResolvedValue(nodo(ids.nodoB));
    repository.obtenerArbol.mockResolvedValue(
      new ArbolConversacional(flujoGrupal(), [nodo(ids.nodoB)], []),
    );
  });

  it('edita solo los campos enviados y deduce el flujo del nodo', async () => {
    const respuesta = await useCase.execute(
      ids.nodoB,
      { contenido: { texto: 'Nuevo' }, orden: null },
      ids.actor,
    );

    const [guardado, actor] = repository.guardarNodo.mock.calls[0];
    expect(guardado).toMatchObject({
      idNodo: ids.nodoB,
      idFlujo: ids.flujo,
      contenido: { texto: 'Nuevo' },
      orden: null,
      esNodoInicial: false,
    });
    expect(actor).toBe(ids.actor);
    expect(respuesta.id_nodo).toBe(ids.nodoB);
  });

  it('rechaza una edición sin cambios', () => {
    expect(() => useCase.execute(ids.nodoB, {}, ids.actor)).toThrow(
      SolicitudActualizacionVaciaException,
    );
  });

  it('responde que el nodo no existe', async () => {
    repository.buscarNodo.mockResolvedValue(null);

    await expect(
      useCase.execute(ids.nodoB, { orden: 3 }, ids.actor),
    ).rejects.toBeInstanceOf(NodoConversacionalNoEncontradoException);
  });

  it('no edita nodos de un flujo que ya no es borrador', async () => {
    repository.obtenerArbol.mockResolvedValue(
      new ArbolConversacional(
        flujoGrupal(EstadoFlujoConversacional.PUBLICADO),
        [nodo(ids.nodoB)],
        [],
      ),
    );

    await expect(
      useCase.execute(ids.nodoB, { orden: 3 }, ids.actor),
    ).rejects.toBeInstanceOf(FlujoConversacionalNoEditableException);
    expect(repository.guardarNodo).not.toHaveBeenCalled();
  });

  it('rechaza un contenido de cronograma inexistente', async () => {
    repository.existeContenidoCronograma.mockResolvedValue(false);

    await expect(
      useCase.execute(
        ids.nodoB,
        { id_contenido_cronograma: 'cc-inexistente' },
        ids.actor,
      ),
    ).rejects.toBeInstanceOf(ContenidoCronogramaNoEncontradoException);
    expect(repository.guardarNodo).not.toHaveBeenCalled();
  });

  it('permite limpiar el contenido asociado enviando null, sin validar', async () => {
    const respuesta = await useCase.execute(
      ids.nodoB,
      { id_contenido_cronograma: null },
      ids.actor,
    );

    expect(repository.existeContenidoCronograma).not.toHaveBeenCalled();
    const [guardado] = repository.guardarNodo.mock.calls[0];
    expect(guardado).toMatchObject({ idContenidoCronograma: null });
    expect(respuesta.id_nodo).toBe(ids.nodoB);
  });

  it('rechaza marcar un nodo como inicial si su orden no es 1', async () => {
    await expect(
      useCase.execute(
        ids.nodoB,
        { es_nodo_inicial: true, orden: 3 },
        ids.actor,
      ),
    ).rejects.toBeInstanceOf(OrdenNodoInicialInvalidoException);
    expect(repository.guardarNodo).not.toHaveBeenCalled();
  });

  it('rechaza un orden que se salta un número', async () => {
    repository.obtenerArbol.mockResolvedValue(
      new ArbolConversacional(
        flujoGrupal(),
        [nodo(ids.nodoA), nodo(ids.nodoB)],
        [],
      ),
    );

    await expect(
      useCase.execute(ids.nodoB, { orden: 5 }, ids.actor),
    ).rejects.toBeInstanceOf(OrdenNodoConSaltoException);
    expect(repository.guardarNodo).not.toHaveBeenCalled();
  });

  it('rechaza un orden ya usado por otro nodo', async () => {
    repository.obtenerArbol.mockResolvedValue(
      new ArbolConversacional(
        flujoGrupal(),
        [nodo(ids.nodoA), nodo(ids.nodoB)],
        [],
      ),
    );

    await expect(
      useCase.execute(ids.nodoB, { orden: 1 }, ids.actor),
    ).rejects.toBeInstanceOf(OrdenNodoDuplicadoException);
    expect(repository.guardarNodo).not.toHaveBeenCalled();
  });
});
