import {
  DimensionPerfilClinico,
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../enums/perfil-clinico.enum';
import { CapturaPerfilInvalidaException } from '../exceptions/nodo.exceptions';
import {
  ConfiguracionRespuestaInvalida,
  configuracionRespuestaInvalida as configuracion,
} from '../exceptions/respuesta.exceptions';

/** RF-27B: valores posibles de cada dimensión del perfil clínico. */
export const VALORES_DIMENSION_PERFIL: Record<
  DimensionPerfilClinico,
  string[]
> = {
  [DimensionPerfilClinico.TIPO_DEPENDENCIA]: Object.values(
    TipoDependenciaClinica,
  ),
  [DimensionPerfilClinico.TIPO_CRAVING]: Object.values(TipoCravingClinico),
};

/**
 * Marca de captura de un nodo. Con `valor`, el nodo asigna ese valor al perfil
 * del estudiante cuando lo responde (RF-25, captura por rama). Sin `valor`
 * (legado), el valor sale de la respuesta de selección única.
 */
export interface CapturaPerfilNodo {
  readonly dimension: DimensionPerfilClinico;
  readonly valor: string | null;
}

/**
 * Lee la marca `capturaPerfil` (o su alias legado `captura_perfil`) del
 * contenido de un nodo. Solo el árbol designa qué nodo captura cada
 * dimensión del perfil clínico (RF-27B); el valor no lo envía el cliente.
 */
export function extraerCapturaPerfil(
  contenido: Record<string, unknown>,
): CapturaPerfilNodo | null {
  const { capturaPerfil, captura_perfil: anterior } = contenido;
  if (capturaPerfil == null && anterior == null) return null;

  const esObjeto =
    typeof capturaPerfil === 'object' && !Array.isArray(capturaPerfil);
  const dimension = esObjeto
    ? (capturaPerfil as { dimension?: unknown } | null)?.dimension
    : capturaPerfil;
  const valor = esObjeto
    ? ((capturaPerfil as { valor?: unknown } | null)?.valor ?? null)
    : null;

  const legado =
    anterior === 'tipo_dependencia'
      ? DimensionPerfilClinico.TIPO_DEPENDENCIA
      : anterior === 'tipo_craving'
        ? DimensionPerfilClinico.TIPO_CRAVING
        : null;

  if (
    (anterior != null && legado === null) ||
    (capturaPerfil != null &&
      dimension !== DimensionPerfilClinico.TIPO_DEPENDENCIA &&
      dimension !== DimensionPerfilClinico.TIPO_CRAVING) ||
    (capturaPerfil != null && legado !== null && dimension !== legado)
  ) {
    return configuracion('Dimensión clínica no configurada o contradictoria.');
  }

  const resuelta = (dimension ?? legado) as DimensionPerfilClinico;
  if (
    valor !== null &&
    (typeof valor !== 'string' ||
      !VALORES_DIMENSION_PERFIL[resuelta].includes(valor))
  ) {
    return configuracion('El valor de captura no pertenece a su dimensión.');
  }
  return { dimension: resuelta, valor };
}

export function extraerDimensionCapturaPerfil(
  contenido: Record<string, unknown>,
): DimensionPerfilClinico | null {
  return extraerCapturaPerfil(contenido)?.dimension ?? null;
}

/** Validación de administración: la marca inválida es un 422, no un error de configuración. */
export function validarCapturaPerfilNodo(
  contenido: Record<string, unknown>,
): CapturaPerfilNodo | null {
  try {
    return extraerCapturaPerfil(contenido);
  } catch (error: unknown) {
    if (error instanceof ConfiguracionRespuestaInvalida)
      throw new CapturaPerfilInvalidaException(
        'Indica una dimensión clínica válida y uno de sus valores: abstinencia física o tolerancia, positivo o negativo.',
      );
    throw error;
  }
}
