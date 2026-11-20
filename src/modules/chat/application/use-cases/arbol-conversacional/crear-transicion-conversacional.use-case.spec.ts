import { ArbolConversacional } from '../../../domain/entities/flujo/arbol-conversacional.entity';
import { NodoConversacional } from '../../../domain/entities/flujo/nodo-conversacional.entity';
import { OperadorCondicion } from '../../../domain/enums/operador-condicional.enum';
import { TipoDatoValidacion } from '../../../domain/enums/tipo-dato-validacion-enum';
import {
  CicloConversacionalNoPermitidoException,
  NodoFueraDeFlujoException,
  NodoOrigenNoEncontradoException,
  ReglaValidacionInvalidaException,
} from '../../../domain/exceptions';
import {
  arbol,
  fecha,
  flujoGrupal,
  ids,
  nodo,
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

    const [guardada, actor] = repository.guardarTransicion.mock.calls[0];
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
    expect(repository.guardarTransicion).not.toHaveBeenCalled();
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
      repository.guardarTransicion.mock.calls[0][0].reglaValidacion,
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
    expect(repository.guardarTransicion).not.toHaveBeenCalled();
  });

  it('rechaza una transición que cierra un ciclo', async () => {
    repository.obtenerArbol.mockResolvedValue(arbol());

    await expect(
      useCase.execute(
        ids.flujo,
        { ...dto, id_nodo_origen: ids.nodoB, id_nodo_destino: ids.nodoA },
        ids.actor,
      ),
    ).rejects.toBeInstanceOf(CicloConversacionalNoPermitidoException);
    expect(repository.guardarTransicion).not.toHaveBeenCalled();
  });
});
