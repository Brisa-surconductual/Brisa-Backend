import { EstadoFlujoConversacional } from '../../../domain/enums/estado-flujo-conversacional.enum';
import {
  ContenidoCronogramaNoEncontradoException,
  FlujoConversacionalNoEditableException,
  NodoConversacionalNoEncontradoException,
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
    repository.obtenerFlujo.mockResolvedValue(flujoGrupal());
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
    repository.obtenerFlujo.mockResolvedValue(
      flujoGrupal(EstadoFlujoConversacional.PUBLICADO),
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
});
