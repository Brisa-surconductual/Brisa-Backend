import { ArbolConversacional } from '../../../domain/entities/flujo/arbol-conversacional.entity';
import { NodoConversacional } from '../../../domain/entities/flujo/nodo-conversacional.entity';
import { TransicionConversacional } from '../../../domain/entities/flujo/transicion-conversacional.entity';
import { OperadorCondicion } from '../../../domain/enums/operador-condicional.enum';
import { TipoDatoValidacion } from '../../../domain/enums/tipo-dato-validacion-enum';
import {
  CicloConversacionalNoPermitidoException,
  DestinoIgualAlPorDefectoException,
  NodoFinalConSalidasException,
  NodoFueraDeFlujoException,
  NodoOrigenNoEncontradoException,
  ReglaValidacionInvalidaException,
  TransicionAutorreferenciadaException,
  TransicionHaciaNodoInicialException,
  TransicionPorDefectoDuplicadaException,
} from '../../../domain/exceptions';
import { construirReglaPorDefecto } from '../../../domain/policies/regla-por-tipo-entrada';
import {
  arbol,
  fecha,
  flujoGrupal,
  ids,
  nodo,
  reglaTexto,
  repositorioSimulado,
} from '../../support/testing/arbol-fixtures';
import { CrearTransicionConversacionalUseCase } from './crear-transicion-conversacional.use-case';

function nodoCon(idNodo: string, contenido: Record<string, unknown>) {
  return new NodoConversacional(
    idNodo,
    ids.flujo,
    ids.tipo,
    'PREGUNTA',
    { texto: 'Hola', ...contenido },
    idNodo === ids.nodoA,
    1,
    null,
    ids.actor,
    fecha,
    fecha,
  );
}

describe('CrearTransicionConversacionalUseCase (RF-25, regla propia)', () => {
  const repository = repositorioSimulado();
  const useCase = new CrearTransicionConversacionalUseCase(repository);
  const dto = {
    id_nodo_origen: ids.nodoA,
    id_nodo_destino: ids.nodoB,
    regla_validacion: {
      valor_esperado: { valor: 'si' },
      mensaje_error: 'Elige una opción.',
    },
    orden_evaluacion: 1,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    repository.obtenerArbol.mockResolvedValue(
      new ArbolConversacional(
        flujoGrupal(),
        [nodo(ids.nodoA), nodo(ids.nodoB)],
        [],
      ),
    );
    repository.buscarNodo.mockImplementation((id) => Promise.resolve(nodo(id)));
  });

  it('crea la transición con su regla propia derivada del nodo origen', async () => {
    const respuesta = await useCase.execute(ids.flujo, dto, ids.actor);

    const [[guardada], actor] = repository.guardarTransiciones.mock.calls[0];
    expect(guardada).toMatchObject({
      idFlujo: ids.flujo,
      idNodoOrigen: ids.nodoA,
      idNodoDestino: ids.nodoB,
      ordenEvaluacion: 1,
    });
    expect(guardada.reglaValidacion).toMatchObject({
      operadorCondicion: OperadorCondicion.IGUALDAD,
      valorEsperado: { valor: 'si' },
      tipoDato: TipoDatoValidacion.TEXTO,
      mensajeError: 'Elige una opción.',
    });
    expect(actor).toBe(ids.actor);
    expect(respuesta.regla_validacion).toMatchObject({
      operador_condicion: OperadorCondicion.IGUALDAD,
      valor_esperado: { valor: 'si' },
    });
  });

  it('rechaza un valor esperado que el nodo origen no define', async () => {
    await expect(
      useCase.execute(
        ids.flujo,
        {
          ...dto,
          regla_validacion: {
            ...dto.regla_validacion,
            valor_esperado: { valor: 'quizas' },
          },
        },
        ids.actor,
      ),
    ).rejects.toBeInstanceOf(ReglaValidacionInvalidaException);
    expect(repository.guardarTransiciones).not.toHaveBeenCalled();
  });

  it('exige la regla cuando el nodo origen espera respuesta', async () => {
    await expect(
      useCase.execute(
        ids.flujo,
        { ...dto, regla_validacion: undefined },
        ids.actor,
      ),
    ).rejects.toBeInstanceOf(ReglaValidacionInvalidaException);
  });

  it('crea una transición sin regla desde un nodo sin respuesta (CONTINUAR)', async () => {
    repository.buscarNodo.mockImplementation((id) =>
      Promise.resolve(id === ids.nodoA ? nodoCon(id, {}) : nodo(id)),
    );

    await useCase.execute(
      ids.flujo,
      { ...dto, regla_validacion: undefined },
      ids.actor,
    );

    expect(
      repository.guardarTransiciones.mock.calls[0][0][0].reglaValidacion,
    ).toBeNull();
  });

  it('rechaza transiciones desde un nodo de texto libre', async () => {
    repository.buscarNodo.mockImplementation((id) =>
      Promise.resolve(
        id === ids.nodoA
          ? nodoCon(id, { entrada: { tipo: 'TEXTO_LIBRE' } })
          : nodo(id),
      ),
    );

    await expect(
      useCase.execute(ids.flujo, dto, ids.actor),
    ).rejects.toBeInstanceOf(ReglaValidacionInvalidaException);
  });

  it('rechaza un nodo que no existe o que pertenece a otro flujo', async () => {
    repository.buscarNodo.mockResolvedValueOnce(null);
    await expect(
      useCase.execute(ids.flujo, dto, ids.actor),
    ).rejects.toBeInstanceOf(NodoOrigenNoEncontradoException);

    repository.buscarNodo.mockResolvedValueOnce(nodo(ids.nodoA, ids.otroFlujo));
    await expect(
      useCase.execute(ids.flujo, dto, ids.actor),
    ).rejects.toBeInstanceOf(NodoFueraDeFlujoException);
    expect(repository.guardarTransiciones).not.toHaveBeenCalled();
  });

  it('rechaza una transición hacia el nodo inicial (RF-25)', async () => {
    repository.obtenerArbol.mockResolvedValue(arbol());

    await expect(
      useCase.execute(
        ids.flujo,
        { ...dto, id_nodo_origen: ids.nodoB, id_nodo_destino: ids.nodoA },
        ids.actor,
      ),
    ).rejects.toBeInstanceOf(TransicionHaciaNodoInicialException);
    expect(repository.guardarTransiciones).not.toHaveBeenCalled();
  });

  it('rechaza una transición que cierra un ciclo', async () => {
    repository.obtenerArbol.mockResolvedValue(
      new ArbolConversacional(
        flujoGrupal(),
        [nodo(ids.nodoA), nodo(ids.nodoB), nodo(idC)],
        [
          new TransicionConversacional(
            idBC,
            ids.flujo,
            ids.nodoB,
            idC,
            1,
            reglaTexto,
            fecha,
          ),
        ],
      ),
    );

    await expect(
      useCase.execute(
        ids.flujo,
        { ...dto, id_nodo_origen: idC, id_nodo_destino: ids.nodoB },
        ids.actor,
      ),
    ).rejects.toBeInstanceOf(CicloConversacionalNoPermitidoException);
    expect(repository.guardarTransiciones).not.toHaveBeenCalled();
  });

  it('rechaza que el origen y el destino sean el mismo nodo (RF-25)', async () => {
    await expect(
      useCase.execute(
        ids.flujo,
        { ...dto, id_nodo_destino: ids.nodoA },
        ids.actor,
      ),
    ).rejects.toBeInstanceOf(TransicionAutorreferenciadaException);
  });

  it('rechaza transiciones de salida desde el nodo final (RF-25)', async () => {
    repository.buscarNodo.mockImplementation((id) =>
      Promise.resolve(id === ids.nodoA ? nodoFinal(id) : nodo(id)),
    );
    await expect(
      useCase.execute(ids.flujo, dto, ids.actor),
    ).rejects.toBeInstanceOf(NodoFinalConSalidasException);
  });

  it('sin orden, toma el siguiente libre del origen (RF-25)', async () => {
    repository.obtenerArbol.mockResolvedValue(arbol());
    repository.buscarNodo.mockImplementation((id) => Promise.resolve(nodo(id)));
    const sinOrden = { ...dto, orden_evaluacion: undefined };

    const respuesta = await useCase.execute(ids.flujo, sinOrden, ids.actor);

    expect(respuesta.orden_evaluacion).toBe(3);
  });

  it('crea la transición "cualquier otra respuesta" y la deja última (RF-25)', async () => {
    repository.obtenerArbol.mockResolvedValue(
      new ArbolConversacional(
        flujoGrupal(),
        [nodo(ids.nodoA), nodo(ids.nodoB), nodo(idC)],
        [],
      ),
    );

    const respuesta = await useCase.execute(
      ids.flujo,
      { ...dto, id_nodo_destino_otro: idC },
      ids.actor,
    );

    const guardadas = repository.guardarTransiciones.mock.calls[0][0];
    expect(guardadas).toHaveLength(2);
    expect(respuesta.orden_evaluacion).toBe(1);
    expect(respuesta.transicion_por_defecto).toMatchObject({
      id_nodo_destino: idC,
      orden_evaluacion: 2,
      regla_validacion: {
        operador_condicion: OperadorCondicion.SIEMPRE,
        valor_esperado: {},
      },
    });
  });

  it('reubica la transición por defecto existente detrás de la nueva (RF-25)', async () => {
    const porDefecto = new TransicionConversacional(
      idBC,
      ids.flujo,
      ids.nodoA,
      idC,
      1,
      construirReglaPorDefecto(nodo(ids.nodoA).contenido),
      fecha,
    );
    repository.obtenerArbol.mockResolvedValue(
      new ArbolConversacional(
        flujoGrupal(),
        [nodo(ids.nodoA), nodo(ids.nodoB), nodo(idC)],
        [porDefecto],
      ),
    );
    const sinOrden = { ...dto, orden_evaluacion: undefined };

    const respuesta = await useCase.execute(ids.flujo, sinOrden, ids.actor);

    expect(respuesta.orden_evaluacion).toBe(1);
    expect(respuesta.transicion_por_defecto?.orden_evaluacion).toBe(2);
    expect(repository.guardarTransiciones.mock.calls[0][0]).toHaveLength(2);
  });

  it('rechaza una segunda transición SIEMPRE en el mismo origen (RF-25)', async () => {
    repository.obtenerArbol.mockResolvedValue(
      new ArbolConversacional(
        flujoGrupal(),
        [nodo(ids.nodoA), nodo(ids.nodoB), nodo(idC)],
        [
          new TransicionConversacional(
            idBC,
            ids.flujo,
            ids.nodoA,
            idC,
            1,
            construirReglaPorDefecto(nodo(ids.nodoA).contenido),
            fecha,
          ),
        ],
      ),
    );

    await expect(
      useCase.execute(
        ids.flujo,
        {
          ...dto,
          regla_validacion: { operador_condicion: OperadorCondicion.SIEMPRE },
        } as typeof dto,
        ids.actor,
      ),
    ).rejects.toBeInstanceOf(TransicionPorDefectoDuplicadaException);
  });
});

describe('CrearTransicionConversacionalUseCase · destino de "cualquier otra respuesta" (RF-25)', () => {
  const repository = repositorioSimulado();
  const useCase = new CrearTransicionConversacionalUseCase(repository);
  const dto = {
    id_nodo_origen: ids.nodoA,
    id_nodo_destino: ids.nodoB,
    regla_validacion: {
      valor_esperado: { valor: 'si' },
      mensaje_error: 'Elige una opción.',
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    repository.buscarNodo.mockImplementation((id) => Promise.resolve(nodo(id)));
  });

  it('rechaza que la transición y "cualquier otra respuesta" vayan al mismo nodo', async () => {
    repository.obtenerArbol.mockResolvedValue(
      new ArbolConversacional(
        flujoGrupal(),
        [nodo(ids.nodoA), nodo(ids.nodoB)],
        [],
      ),
    );

    await expect(
      useCase.execute(
        ids.flujo,
        { ...dto, id_nodo_destino_otro: ids.nodoB },
        ids.actor,
      ),
    ).rejects.toBeInstanceOf(DestinoIgualAlPorDefectoException);
    expect(repository.guardarTransiciones).not.toHaveBeenCalled();
  });

  it('rechaza una transición hacia el destino que ya tiene "cualquier otra respuesta"', async () => {
    repository.obtenerArbol.mockResolvedValue(
      new ArbolConversacional(
        flujoGrupal(),
        [nodo(ids.nodoA), nodo(ids.nodoB)],
        [
          new TransicionConversacional(
            idBC,
            ids.flujo,
            ids.nodoA,
            ids.nodoB,
            1,
            construirReglaPorDefecto(nodo(ids.nodoA).contenido),
            fecha,
          ),
        ],
      ),
    );

    await expect(
      useCase.execute(ids.flujo, dto, ids.actor),
    ).rejects.toBeInstanceOf(DestinoIgualAlPorDefectoException);
  });
});

const idC = '00000000-0000-4000-8000-0000000000c0';
const idBC = '00000000-0000-4000-8000-0000000000bc';

function nodoFinal(idNodo: string): NodoConversacional {
  const base = nodo(idNodo);
  return new NodoConversacional(
    base.idNodo,
    base.idFlujo,
    base.idTipoNodo,
    base.nombreTipoNodo,
    { texto: 'Fin' },
    false,
    base.orden,
    null,
    base.creadoPor,
    base.fechaCreacion,
    base.fechaActualizacion,
    true,
  );
}
