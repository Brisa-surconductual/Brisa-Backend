import { ArbolConversacional } from '../../../domain/entities/flujo/arbol-conversacional.entity';
import { EstadoFlujoConversacional } from '../../../domain/enums/estado-flujo-conversacional.enum';
import {
  ContenidoCronogramaNoEncontradoException,
  FlujoConversacionalNoEditableException,
  NodoConversacionalNoEncontradoException,
  OrdenNodoConSaltoException,
  OrdenNodoDuplicadoException,
  OrdenNodoInicialInvalidoException,
  NodoFinalConEntradaException,
  NodoFinalConSalidasException,
  NodoInicialYFinalException,
  TransicionesAfectadasException,
} from '../../../domain/exceptions';
import { SolicitudActualizacionVaciaException } from '../../exceptions/solicitud-actualizacion-vacia.exception';
import {
  flujoGrupal,
  ids,
  nodo,
  repositorioSimulado,
  transicion,
  transicionNo,
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
    repository.existeContenido.mockResolvedValue(false);

    await expect(
      useCase.execute(ids.nodoB, { id_contenido: 'cc-inexistente' }, ids.actor),
    ).rejects.toBeInstanceOf(ContenidoCronogramaNoEncontradoException);
    expect(repository.guardarNodo).not.toHaveBeenCalled();
  });

  it('permite limpiar el contenido asociado enviando null, sin validar', async () => {
    const respuesta = await useCase.execute(
      ids.nodoB,
      { id_contenido: null },
      ids.actor,
    );

    expect(repository.existeContenido).not.toHaveBeenCalled();
    const [guardado] = repository.guardarNodo.mock.calls[0];
    expect(guardado).toMatchObject({ idContenido: null });
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

  describe('RF-25: cambio de tipo de respuesta', () => {
    beforeEach(() => {
      repository.buscarNodo.mockResolvedValue(nodo(ids.nodoA));
      repository.obtenerArbol.mockResolvedValue(
        new ArbolConversacional(
          flujoGrupal(),
          [nodo(ids.nodoA), nodo(ids.nodoB)],
          [transicion(), transicionNo()],
        ),
      );
    });
    const escala = {
      texto: 'Del 1 al 5',
      entrada: { tipo: 'ESCALA', min: 1, max: 5, paso: 2 },
    };

    it('pide confirmación listando las transiciones que dejan de tener sentido', async () => {
      const error = (await useCase
        .execute(ids.nodoA, { contenido: escala }, ids.actor)
        .catch((e: unknown) => e)) as TransicionesAfectadasException;

      expect(error).toBeInstanceOf(TransicionesAfectadasException);
      expect(error.codigo).toBe('TRANSICIONES_AFECTADAS');
      expect(
        (error.detalles as { transiciones: unknown[] }).transiciones,
      ).toHaveLength(2);
      expect(repository.guardarNodo).not.toHaveBeenCalled();
    });

    it('con confirmación guarda el nodo y elimina sus transiciones', async () => {
      await useCase.execute(
        ids.nodoA,
        { contenido: escala, eliminar_transiciones_afectadas: true },
        ids.actor,
      );

      const [guardado, , eliminadas] = repository.guardarNodo.mock.calls[0];
      expect(eliminadas?.map((t) => t.idTransicion)).toEqual([
        transicion().idTransicion,
        transicionNo().idTransicion,
      ]);
      // RF-25: la escala avanza de 1 en 1; el paso se descarta al guardar.
      expect(guardado.contenido.entrada).toEqual({
        tipo: 'ESCALA',
        min: 1,
        max: 5,
      });
    });

    it('no pide confirmación si el tipo de respuesta no cambia', async () => {
      await useCase.execute(
        ids.nodoA,
        { contenido: { ...nodo(ids.nodoA).contenido, texto: 'Otro texto' } },
        ids.actor,
      );

      expect(repository.guardarNodo.mock.calls[0][2]).toEqual([]);
    });
  });

  describe('RF-25: nodo final', () => {
    it('no puede ser también el nodo inicial', async () => {
      repository.buscarNodo.mockResolvedValue(nodo(ids.nodoA));
      await expect(
        useCase.execute(
          ids.nodoA,
          { es_nodo_final: true, contenido: { texto: 'Fin' } },
          ids.actor,
        ),
      ).rejects.toBeInstanceOf(NodoInicialYFinalException);
    });

    it('no espera respuesta', async () => {
      await expect(
        useCase.execute(ids.nodoB, { es_nodo_final: true }, ids.actor),
      ).rejects.toBeInstanceOf(NodoFinalConEntradaException);
    });

    it('no puede conservar transiciones de salida', async () => {
      repository.obtenerArbol.mockResolvedValue(
        new ArbolConversacional(
          flujoGrupal(),
          [nodo(ids.nodoA), nodo(ids.nodoB)],
          [transicion(ids.nodoB, ids.nodoA)],
        ),
      );
      await expect(
        useCase.execute(
          ids.nodoB,
          { es_nodo_final: true, contenido: { texto: 'Fin' } },
          ids.actor,
        ),
      ).rejects.toBeInstanceOf(TransicionesAfectadasException);
    });

    it('rechaza marcar como final un nodo sin respuesta que tiene salidas', async () => {
      const sinRespuesta = nodo(ids.nodoB).actualizar({
        contenido: { texto: 'Info' },
      });
      repository.buscarNodo.mockResolvedValue(sinRespuesta);
      repository.obtenerArbol.mockResolvedValue(
        new ArbolConversacional(
          flujoGrupal(),
          [nodo(ids.nodoA), sinRespuesta],
          [transicion(ids.nodoB, ids.nodoA)],
        ),
      );
      await expect(
        useCase.execute(ids.nodoB, { es_nodo_final: true }, ids.actor),
      ).rejects.toBeInstanceOf(NodoFinalConSalidasException);
    });

    it('marca el nodo como final cuando cumple las reglas', async () => {
      await useCase.execute(
        ids.nodoB,
        { es_nodo_final: true, contenido: { texto: 'Fin' } },
        ids.actor,
      );

      expect(repository.guardarNodo.mock.calls[0][0].esNodoFinal).toBe(true);
    });
  });
});
