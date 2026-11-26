import { variableNodoServicePrueba } from '../../support/testing/taxonomia-variables.fixture';
import { ArbolConversacional } from '../../../domain/entities/flujo/arbol-conversacional.entity';
import { TipoNodoConversacional } from '../../../domain/entities/catalogos/tipo-nodo.entity';
import { EstadoFlujoConversacional } from '../../../domain/enums/estado-flujo-conversacional.enum';
import {
  ContenidoCronogramaNoEncontradoException,
  FlujoConversacionalNoEditableException,
  FlujoConversacionalNoEncontradoException,
  OrdenNodoConSaltoException,
  OrdenNodoDuplicadoException,
  OrdenNodoInicialInvalidoException,
  TipoNodoNoEncontradoException,
} from '../../../domain/exceptions';
import {
  flujoGrupal,
  ids,
  nodo,
  repositorioSimulado,
} from '../../support/testing/arbol-fixtures';
import { CrearNodoConversacionalUseCase } from './crear-nodo-conversacional.use-case';

describe('CrearNodoConversacionalUseCase (RF-25)', () => {
  const repository = repositorioSimulado();
  const useCase = new CrearNodoConversacionalUseCase(
    repository,
    variableNodoServicePrueba(),
  );
  const dto = {
    id_tipo_nodo: ids.tipo,
    contenido: { texto: 'Inicio' },
    es_nodo_inicial: true,
    orden: 1,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    repository.obtenerArbol.mockResolvedValue(
      new ArbolConversacional(flujoGrupal(), [], []),
    );
    repository.buscarTipoNodo.mockResolvedValue(
      new TipoNodoConversacional(ids.tipo, 'MENSAJE'),
    );
  });

  it('agrega el nodo al flujo en borrador', async () => {
    const respuesta = await useCase.execute(ids.flujo, dto, ids.actor);

    const [guardado, actor] = repository.guardarNodo.mock.calls[0];
    expect(guardado).toMatchObject({
      idFlujo: ids.flujo,
      idTipoNodo: ids.tipo,
      esNodoInicial: true,
      orden: 1,
      idContenido: null,
      creadoPor: ids.actor,
    });
    expect(actor).toBe(ids.actor);
    expect(respuesta).toMatchObject({
      id_nodo: guardado.idNodo,
      id_flujo: ids.flujo,
    });
  });

  it('no modifica un flujo que ya no es borrador', async () => {
    repository.obtenerArbol.mockResolvedValue(
      new ArbolConversacional(
        flujoGrupal(EstadoFlujoConversacional.PUBLICADO),
        [],
        [],
      ),
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
    repository.obtenerArbol.mockResolvedValue(null);

    await expect(
      useCase.execute(ids.flujo, dto, ids.actor),
    ).rejects.toBeInstanceOf(FlujoConversacionalNoEncontradoException);
  });

  it('rechaza un contenido de cronograma inexistente', async () => {
    repository.existeContenido.mockResolvedValue(false);

    await expect(
      useCase.execute(
        ids.flujo,
        { ...dto, id_contenido: 'cc-inexistente' },
        ids.actor,
      ),
    ).rejects.toBeInstanceOf(ContenidoCronogramaNoEncontradoException);
    expect(repository.guardarNodo).not.toHaveBeenCalled();
  });

  it('acepta un contenido de cronograma existente', async () => {
    repository.existeContenido.mockResolvedValue(true);

    await useCase.execute(
      ids.flujo,
      { ...dto, id_contenido: 'cc-1' },
      ids.actor,
    );

    expect(repository.existeContenido).toHaveBeenCalledWith('cc-1');
    const [guardado] = repository.guardarNodo.mock.calls[0];
    expect(guardado).toMatchObject({ idContenido: 'cc-1' });
  });

  it('rechaza el nodo inicial si su orden no es 1', async () => {
    await expect(
      useCase.execute(ids.flujo, { ...dto, orden: 2 }, ids.actor),
    ).rejects.toBeInstanceOf(OrdenNodoInicialInvalidoException);
    expect(repository.guardarNodo).not.toHaveBeenCalled();
  });

  it('rechaza un orden que se salta un número', async () => {
    repository.obtenerArbol.mockResolvedValue(
      new ArbolConversacional(flujoGrupal(), [nodo(ids.nodoA)], []),
    );

    await expect(
      useCase.execute(
        ids.flujo,
        { ...dto, es_nodo_inicial: false, orden: 3 },
        ids.actor,
      ),
    ).rejects.toBeInstanceOf(OrdenNodoConSaltoException);
    expect(repository.guardarNodo).not.toHaveBeenCalled();
  });

  it('rechaza un orden ya usado por otro nodo', async () => {
    repository.obtenerArbol.mockResolvedValue(
      new ArbolConversacional(flujoGrupal(), [nodo(ids.nodoA)], []),
    );

    await expect(
      useCase.execute(
        ids.flujo,
        { ...dto, es_nodo_inicial: false, orden: 1 },
        ids.actor,
      ),
    ).rejects.toBeInstanceOf(OrdenNodoDuplicadoException);
    expect(repository.guardarNodo).not.toHaveBeenCalled();
  });

  describe('RF-30B variable taxonómica del nodo', () => {
    const conVariable = (entrada: unknown) => ({
      ...dto,
      contenido: {
        texto: '¿Qué tanto deseo de vapear sientes?',
        entrada,
        variable: { codigo: 'NIVEL_CRAVING' },
      },
    });
    beforeEach(() => {
      repository.buscarTipoNodo.mockResolvedValue(
        new TipoNodoConversacional(ids.tipo, 'PREGUNTA'),
      );
    });

    it('guarda un nodo cuya entrada admite la variable', async () => {
      const casoDeUso = new CrearNodoConversacionalUseCase(
        repository,
        variableNodoServicePrueba(),
      );
      await casoDeUso.execute(
        ids.flujo,
        conVariable({ tipo: 'ESCALA', min: 0, max: 10 }),
        ids.actor,
      );
      expect(repository.guardarNodo.mock.calls).toHaveLength(1);
    });

    it('rechaza una entrada que la variable no admite, sin guardar', async () => {
      const casoDeUso = new CrearNodoConversacionalUseCase(
        repository,
        variableNodoServicePrueba(),
      );
      await expect(
        casoDeUso.execute(
          ids.flujo,
          conVariable({ tipo: 'OPCION_UNICA', opciones: ['A'] }),
          ids.actor,
        ),
      ).rejects.toMatchObject({ codigo: 'TIPO_ENTRADA_INCOMPATIBLE' });
      expect(repository.guardarNodo.mock.calls).toHaveLength(0);
    });

    it('rechaza una variable inexistente, sin guardar', async () => {
      const casoDeUso = new CrearNodoConversacionalUseCase(
        repository,
        variableNodoServicePrueba([]),
      );
      await expect(
        casoDeUso.execute(
          ids.flujo,
          conVariable({ tipo: 'ESCALA', min: 0, max: 10 }),
          ids.actor,
        ),
      ).rejects.toMatchObject({ codigo: 'VARIABLE_NO_VALIDA' });
      expect(repository.guardarNodo.mock.calls).toHaveLength(0);
    });
  });
});
