import { TipoNodoConversacional } from '../../../domain/entities/catalogos/tipo-nodo.entity';
import { EstadoFlujoConversacional } from '../../../domain/enums/estado-flujo-conversacional.enum';
import {
  ContenidoCronogramaNoEncontradoException,
  FlujoConversacionalNoEditableException,
  FlujoConversacionalNoEncontradoException,
  TipoNodoNoEncontradoException,
} from '../../../domain/exceptions';
import {
  flujoGrupal,
  ids,
  repositorioSimulado,
} from '../../support/testing/arbol-fixtures';
import { CrearNodoConversacionalUseCase } from './crear-nodo-conversacional.use-case';

describe('CrearNodoConversacionalUseCase (RF-25)', () => {
  const repository = repositorioSimulado();
  const useCase = new CrearNodoConversacionalUseCase(repository);
  const dto = {
    id_tipo_nodo: ids.tipo,
    contenido: { texto: 'Inicio' },
    es_nodo_inicial: true,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    repository.obtenerFlujo.mockResolvedValue(flujoGrupal());
    repository.buscarTipoNodo.mockResolvedValue(
      new TipoNodoConversacional(ids.tipo, 'MENSAJE'),
    );
  });

  it('agrega el nodo al flujo en borrador con valores opcionales en null', async () => {
    const respuesta = await useCase.execute(ids.flujo, dto, ids.actor);

    const [guardado, actor] = repository.guardarNodo.mock.calls[0];
    expect(guardado).toMatchObject({
      idFlujo: ids.flujo,
      idTipoNodo: ids.tipo,
      esNodoInicial: true,
      orden: null,
      idContenidoCronograma: null,
      creadoPor: ids.actor,
    });
    expect(actor).toBe(ids.actor);
    expect(respuesta).toMatchObject({
      id_nodo: guardado.idNodo,
      id_flujo: ids.flujo,
    });
  });

  it('no modifica un flujo que ya no es borrador', async () => {
    repository.obtenerFlujo.mockResolvedValue(
      flujoGrupal(EstadoFlujoConversacional.PUBLICADO),
    );

    await expect(
      useCase.execute(ids.flujo, dto, ids.actor),
    ).rejects.toBeInstanceOf(FlujoConversacionalNoEditableException);
    expect(repository.guardarNodo).not.toHaveBeenCalled();
  });

  it('rechaza un tipo de nodo inexistente', async () => {
    repository.buscarTipoNodo.mockResolvedValue(null);

    await expect(
      useCase.execute(ids.flujo, dto, ids.actor),
    ).rejects.toBeInstanceOf(TipoNodoNoEncontradoException);
  });

  it('responde que el flujo no existe', async () => {
    repository.obtenerFlujo.mockResolvedValue(null);

    await expect(
      useCase.execute(ids.flujo, dto, ids.actor),
    ).rejects.toBeInstanceOf(FlujoConversacionalNoEncontradoException);
  });

  it('rechaza un contenido de cronograma inexistente', async () => {
    repository.existeContenidoCronograma.mockResolvedValue(false);

    await expect(
      useCase.execute(
        ids.flujo,
        { ...dto, id_contenido_cronograma: 'cc-inexistente' },
        ids.actor,
      ),
    ).rejects.toBeInstanceOf(ContenidoCronogramaNoEncontradoException);
    expect(repository.guardarNodo).not.toHaveBeenCalled();
  });

  it('acepta un contenido de cronograma existente', async () => {
    repository.existeContenidoCronograma.mockResolvedValue(true);

    await useCase.execute(
      ids.flujo,
      { ...dto, id_contenido_cronograma: 'cc-1' },
      ids.actor,
    );

    expect(repository.existeContenidoCronograma).toHaveBeenCalledWith('cc-1');
    const [guardado] = repository.guardarNodo.mock.calls[0];
    expect(guardado).toMatchObject({ idContenidoCronograma: 'cc-1' });
  });
});
