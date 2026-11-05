import { TipoDatoValidacion } from '../../../domain/enums/tipo-dato-validacion-enum';
import { ReglaValidacionInvalidaException } from '../../../domain/exceptions';
import { ids, repositorioSimulado } from '../../support/testing/arbol-fixtures';
import { CrearReglaValidacionUseCase } from './crear-regla-validacion.use-case';

describe('CrearReglaValidacionUseCase (RF-25 / RF-28)', () => {
  const repository = repositorioSimulado();
  const useCase = new CrearReglaValidacionUseCase(repository);

  beforeEach(() => jest.resetAllMocks());

  it('crea la regla con valores iniciales y la audita con el actor', async () => {
    const respuesta = await useCase.execute(
      {
        tipo_dato: TipoDatoValidacion.TEXTO,
        mensaje_error: ' Requerida ',
      } as never,
      ids.actor,
    );

    const [guardada, actor] = repository.guardarReglaValidacion.mock.calls[0];
    expect(guardada).toMatchObject({
      tipoDato: TipoDatoValidacion.TEXTO,
      obligatorio: true,
      valorMin: null,
      valorMax: null,
      formatoRegex: null,
      valoresPermitidos: [],
      mensajeError: 'Requerida',
    });
    expect(actor).toBe(ids.actor);
    expect(respuesta.id_regla_validacion).toBe(guardada.idReglaValidacion);
  });

  it('conserva false, cero y decimales en una regla numérica', async () => {
    await useCase.execute(
      {
        tipo_dato: TipoDatoValidacion.NUMERICO,
        obligatorio: false,
        valor_min: 0,
        valor_max: 2.75,
        mensaje_error: 'Fuera de rango',
      } as never,
      ids.actor,
    );

    expect(repository.guardarReglaValidacion.mock.calls[0][0]).toMatchObject({
      obligatorio: false,
      valorMin: 0,
      valorMax: 2.75,
    });
  });

  it('rechaza una regla incoherente antes de guardarla', async () => {
    await expect(
      useCase.execute(
        {
          tipo_dato: TipoDatoValidacion.NUMERICO,
          valor_min: 10,
          valor_max: 1,
          mensaje_error: 'Fuera de rango',
        } as never,
        ids.actor,
      ),
    ).rejects.toBeInstanceOf(ReglaValidacionInvalidaException);
    expect(repository.guardarReglaValidacion).not.toHaveBeenCalled();
  });
});
