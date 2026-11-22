import { VariableTaxonomia } from '../../../domain/entities/taxonomia/variable-taxonomia.entity';
import { TipoEntradaRespuesta as Entrada } from '../../../domain/enums/tipo-entrada-respuesta.enum';
import { TipoValorVariable as Tipo } from '../../../domain/enums/tipo-valor-variable.enum';
import { TaxonomiaVariablesRepository } from '../../../domain/repositories/taxonomia-variables.repository';
import { VariableNodoService } from '../../services/variable-nodo.service';

/** Seed v1.0 de RF-30B, para pruebas. */
export const variablesSeed = {
  nivelCraving: new VariableTaxonomia(
    '30b00000-0000-4000-8000-000000000001',
    'NIVEL_CRAVING',
    'Nivel de craving',
    null,
    Tipo.ENTERO,
    null,
    [Entrada.ESCALA, Entrada.NUMERICO],
    [
      { min: 0, max: 3, etiqueta: 'CRAVING_BAJO' },
      { min: 4, max: 6, etiqueta: 'CRAVING_MODERADO' },
      { min: 7, max: 10, etiqueta: 'CRAVING_ALTO' },
    ],
    true,
  ),
  contextoEmocional: new VariableTaxonomia(
    '30b00000-0000-4000-8000-000000000003',
    'CONTEXTO_EMOCIONAL',
    'Contexto emocional',
    null,
    Tipo.CATEGORIA,
    [
      'ANSIEDAD',
      'ESTRES',
      'TRISTEZA',
      'ABURRIMIENTO',
      'ENOJO',
      'SOLEDAD',
      'ALEGRIA',
      'CALMA',
    ],
    [Entrada.OPCION_UNICA, Entrada.MULTISELECCION],
    {},
    true,
  ),
  situacionRiesgo: new VariableTaxonomia(
    '30b00000-0000-4000-8000-000000000004',
    'SITUACION_RIESGO',
    'Situación de riesgo',
    null,
    Tipo.BOOLEANO,
    null,
    [Entrada.BOOLEANO],
    { true: 'RIESGO_PRESENTE', false: 'RIESGO_AUSENTE' },
    true,
  ),
};

/** Repositorio de lectura en memoria. */
export function taxonomiaPrueba(
  variables: VariableTaxonomia[] = Object.values(variablesSeed),
): TaxonomiaVariablesRepository {
  return {
    buscarPorCodigo: jest.fn((codigo: string) =>
      Promise.resolve(variables.find((v) => v.codigo === codigo) ?? null),
    ),
  } as unknown as TaxonomiaVariablesRepository;
}

export function variableNodoServicePrueba(
  variables?: VariableTaxonomia[],
): VariableNodoService {
  return new VariableNodoService(taxonomiaPrueba(variables));
}
