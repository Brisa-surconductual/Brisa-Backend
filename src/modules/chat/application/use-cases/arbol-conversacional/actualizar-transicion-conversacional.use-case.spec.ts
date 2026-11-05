import { ReglaValidacion } from '../../../domain/entities/reglas-validacion/reglas-validacion.entity';
import { TipoDatoValidacion } from '../../../domain/enums/tipo-dato-validacion-enum';
import {
  ReglaValidacionInvalidaException,
  ReglaValidacionNoEncontradaException,
  TransicionConversacionalNoEncontradaException,
} from '../../../domain/exceptions';
import { SolicitudActualizacionVaciaException } from '../../exceptions/solicitud-actualizacion-vacia.exception';
import {
  arbol,
  ids,
  nodo,
  repositorioSimulado,
  transicion,
} from '../../support/testing/arbol-fixtures';
import { ActualizarTransicionConversacionalUseCase } from './actualizar-transicion-conversacional.use-case';

describe('ActualizarTransicionConversacionalUseCase (RF-25)', () => {
  const repository = repositorioSimulado();
  const useCase = new ActualizarTransicionConversacionalUseCase(repository);

  beforeEach(() => {
    jest.resetAllMocks();
    repository.buscarTransicion.mockResolvedValue(transicion());
    repository.obtenerArbol.mockResolvedValue(arbol());
    repository.buscarNodo.mockImplementation((id) => Promise.resolve(nodo(id)));
  });

  it('conserva lo que no se envía y deduce el flujo de la transición', async () => {
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
    expect(guardada.reglaValidacion.idReglaValidacion).toBe(ids.regla);
    expect(actor).toBe(ids.actor);
    expect(respuesta.id_transicion).toBe(ids.transicion);
  });

  it('sustituye la regla de validación por otra existente', async () => {
    const otra = new ReglaValidacion(
      'regla-nueva',
      TipoDatoValidacion.TEXTO,
      true,
      null,
      null,
      null,
      [],
      'Otro mensaje',
    );
    repository.buscarReglaValidacion.mockResolvedValue(otra);

    await useCase.execute(
      ids.transicion,
      { id_regla_validacion: 'regla-nueva' },
      ids.actor,
    );

    expect(repository.guardarTransicion.mock.calls[0][0].reglaValidacion).toBe(
      otra,
    );
  });

  it('edita la regla en su sitio cuando solo esta transición la usa', async () => {
    repository.contarUsosReglaValidacion.mockResolvedValue(1);

    await useCase.execute(
      ids.transicion,
      { regla_validacion: { mensaje_error: 'Nuevo mensaje' } },
      ids.actor,
    );

    const regla = repository.guardarTransicion.mock.calls[0][0].reglaValidacion;
    expect(regla.idReglaValidacion).toBe(ids.regla);
    expect(regla.mensajeError).toBe('Nuevo mensaje');
  });

  it('edita una copia cuando la regla la comparten varias transiciones', async () => {
    repository.contarUsosReglaValidacion.mockResolvedValue(3);

    await useCase.execute(
      ids.transicion,
      { regla_validacion: { mensaje_error: 'Nuevo mensaje' } },
      ids.actor,
    );

    const regla = repository.guardarTransicion.mock.calls[0][0].reglaValidacion;
    expect(regla.idReglaValidacion).not.toBe(ids.regla);
    expect(regla.mensajeError).toBe('Nuevo mensaje');
  });

  it('no permite sustituir y editar la regla a la vez', async () => {
    await expect(
      useCase.execute(
        ids.transicion,
        {
          id_regla_validacion: 'otra',
          regla_validacion: { mensaje_error: 'x' },
        },
        ids.actor,
      ),
    ).rejects.toBeInstanceOf(ReglaValidacionInvalidaException);
    expect(repository.guardarTransicion).not.toHaveBeenCalled();
  });

  it('rechaza una regla de reemplazo inexistente', async () => {
    repository.buscarReglaValidacion.mockResolvedValue(null);

    await expect(
      useCase.execute(
        ids.transicion,
        { id_regla_validacion: 'no-existe' },
        ids.actor,
      ),
    ).rejects.toBeInstanceOf(ReglaValidacionNoEncontradaException);
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
