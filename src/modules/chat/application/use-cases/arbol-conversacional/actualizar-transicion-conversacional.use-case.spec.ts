import { OperadorCondicion } from '../../../domain/enums/operador-condicional.enum';
import {
  ReglaValidacionInvalidaException,
  TransicionConversacionalNoEncontradaException,
} from '../../../domain/exceptions';
import { SolicitudActualizacionVaciaException } from '../../exceptions/solicitud-actualizacion-vacia.exception';
import {
  arbol,
  ids,
  nodo,
  reglaTexto,
  repositorioSimulado,
  transicion,
} from '../../support/testing/arbol-fixtures';
import { ActualizarTransicionConversacionalUseCase } from './actualizar-transicion-conversacional.use-case';

describe('ActualizarTransicionConversacionalUseCase (RF-25, regla propia)', () => {
  const repository = repositorioSimulado();
  const useCase = new ActualizarTransicionConversacionalUseCase(repository);

  beforeEach(() => {
    jest.resetAllMocks();
    repository.buscarTransicion.mockResolvedValue(transicion());
    repository.obtenerArbol.mockResolvedValue(arbol());
    repository.buscarNodo.mockImplementation((id) => Promise.resolve(nodo(id)));
  });

  it('conserva lo que no se envía, incluida su regla', async () => {
    const respuesta = await useCase.execute(
      ids.transicion,
      { orden_evaluacion: 2 },
      ids.actor,
    );

    const [guardada, actor] = repository.guardarTransicion.mock.calls[0];
    expect(guardada).toMatchObject({
      idTransicion: ids.transicion,
      idFlujo: ids.flujo,
      idNodoOrigen: ids.nodoA,
      idNodoDestino: ids.nodoB,
      ordenEvaluacion: 2,
    });
    expect(guardada.reglaValidacion).toBe(reglaTexto);
    expect(actor).toBe(ids.actor);
    expect(respuesta.id_transicion).toBe(ids.transicion);
  });

  it('reemplaza la regla propia por una nueva derivada del nodo origen', async () => {
    await useCase.execute(
      ids.transicion,
      {
        regla_validacion: {
          valor_esperado: { valor: 'no' },
          mensaje_error: 'Elige no.',
        },
      },
      ids.actor,
    );

    const regla = repository.guardarTransicion.mock.calls[0][0].reglaValidacion;
    expect(regla).toMatchObject({
      operadorCondicion: OperadorCondicion.IGUALDAD,
      valorEsperado: { valor: 'no' },
      mensajeError: 'Elige no.',
    });
    expect(regla?.idReglaValidacion).not.toBe(ids.regla);
  });

  it('rechaza una regla que el nodo origen no admite', async () => {
    await expect(
      useCase.execute(
        ids.transicion,
        {
          regla_validacion: {
            operador_condicion: OperadorCondicion.RANGO,
            valor_esperado: { min: 1, max: 2 },
            mensaje_error: 'x',
          },
        },
        ids.actor,
      ),
    ).rejects.toBeInstanceOf(ReglaValidacionInvalidaException);
    expect(repository.guardarTransicion).not.toHaveBeenCalled();
  });

  it('rechaza una edición sin cambios', () => {
    expect(() => useCase.execute(ids.transicion, {}, ids.actor)).toThrow(
      SolicitudActualizacionVaciaException,
    );
  });

  it('responde que la transición no existe', async () => {
    repository.buscarTransicion.mockResolvedValue(null);

    await expect(
      useCase.execute(ids.transicion, { orden_evaluacion: 2 }, ids.actor),
    ).rejects.toBeInstanceOf(TransicionConversacionalNoEncontradaException);
  });
});
