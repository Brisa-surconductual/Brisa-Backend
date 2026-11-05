import { ArbolConversacional } from '../../../domain/entities/flujo/arbol-conversacional.entity';
import { TipoDatoValidacion } from '../../../domain/enums/tipo-dato-validacion-enum';
import { OperadorCondicion } from '../../../domain/enums/operador-condicional.enum';
import {
  CicloConversacionalNoPermitidoException,
  NodoFueraDeFlujoException,
  NodoOrigenNoEncontradoException,
  ReglaValidacionInvalidaException,
  ReglaValidacionNoEncontradaException,
} from '../../../domain/exceptions';
import {
  arbol,
  flujoGrupal,
  ids,
  nodo,
  reglaTexto,
  repositorioSimulado,
} from '../../support/testing/arbol-fixtures';
import { CrearTransicionConversacionalUseCase } from './crear-transicion-conversacional.use-case';

describe('CrearTransicionConversacionalUseCase (RF-25)', () => {
  const repository = repositorioSimulado();
  const useCase = new CrearTransicionConversacionalUseCase(repository);
  const dto = {
    id_nodo_origen: ids.nodoA,
    id_nodo_destino: ids.nodoB,
    id_regla_validacion: ids.regla,
    operador_condicion: OperadorCondicion.IGUALDAD,
    valor_condicion: { valor: 'si' },
    orden_evaluacion: 1,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    repository.buscarReglaValidacion.mockResolvedValue(reglaTexto);
    repository.obtenerArbol.mockResolvedValue(
      new ArbolConversacional(
        flujoGrupal(),
        [nodo(ids.nodoA), nodo(ids.nodoB)],
        [],
      ),
    );
    repository.buscarNodo.mockImplementation((id) => Promise.resolve(nodo(id)));
  });

  it('crea la transición con una regla de validación existente', async () => {
    const respuesta = await useCase.execute(ids.flujo, dto, ids.actor);

    const [guardada, actor] = repository.guardarTransicion.mock.calls[0];
    expect(guardada).toMatchObject({
      idFlujo: ids.flujo,
      idNodoOrigen: ids.nodoA,
      idNodoDestino: ids.nodoB,
      ordenEvaluacion: 1,
    });
    expect(guardada.reglaValidacion).toBe(reglaTexto);
    expect(actor).toBe(ids.actor);
    expect(respuesta).toMatchObject({
      id_transicion: guardada.idTransicion,
      regla_validacion: expect.objectContaining({
        id_regla_validacion: ids.regla,
      }),
    });
  });

  it('crea la transición con una regla nueva embebida', async () => {
    const base = { ...dto, id_regla_validacion: undefined };

    const respuesta = await useCase.execute(
      ids.flujo,
      {
        ...base,
        regla_validacion: {
          tipo_dato: TipoDatoValidacion.TEXTO,
          obligatorio: true,
          valores_permitidos: [],
          mensaje_error: 'Respuesta requerida',
        },
      },
      ids.actor,
    );

    const guardada = repository.guardarTransicion.mock.calls[0][0];
    expect(repository.buscarReglaValidacion).not.toHaveBeenCalled();
    expect(guardada.reglaValidacion.idReglaValidacion).not.toBe(ids.regla);
    expect(respuesta.regla_validacion.mensaje_error).toBe(
      'Respuesta requerida',
    );
  });

  it('exige una regla existente o una embebida, exclusivamente una', () => {
    const base = { ...dto, id_regla_validacion: undefined };

    expect(() => useCase.execute(ids.flujo, base, ids.actor)).toThrow(
      ReglaValidacionInvalidaException,
    );
    expect(() =>
      useCase.execute(
        ids.flujo,
        {
          ...dto,
          regla_validacion: {
            tipo_dato: TipoDatoValidacion.TEXTO,
            obligatorio: true,
            valores_permitidos: [],
            mensaje_error: 'x',
          },
        },
        ids.actor,
      ),
    ).toThrow(ReglaValidacionInvalidaException);
  });

  it('rechaza una regla embebida incoherente antes de guardar', () => {
    const base = { ...dto, id_regla_validacion: undefined };

    expect(() =>
      useCase.execute(
        ids.flujo,
        {
          ...base,
          regla_validacion: {
            tipo_dato: TipoDatoValidacion.NUMERICO,
            obligatorio: true,
            valor_min: 10,
            valor_max: 1,
            valores_permitidos: [],
            mensaje_error: 'Fuera de rango',
          },
        },
        ids.actor,
      ),
    ).toThrow(ReglaValidacionInvalidaException);
    expect(repository.guardarTransicion).not.toHaveBeenCalled();
  });

  it('rechaza una regla de validación inexistente', async () => {
    repository.buscarReglaValidacion.mockResolvedValue(null);

    await expect(
      useCase.execute(ids.flujo, dto, ids.actor),
    ).rejects.toBeInstanceOf(ReglaValidacionNoEncontradaException);
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
