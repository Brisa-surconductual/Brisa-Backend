import { CODIGO_VARIABLE } from '../entities/taxonomia/variable-taxonomia.entity';
import {
  ConfiguracionRespuestaInvalida,
  configuracionRespuestaInvalida as configuracion,
} from '../exceptions/respuesta.exceptions';
import { VariableNodoInvalidaException } from '../exceptions/taxonomia.exceptions';
import { esObjetoRespuesta } from './configuracion-entrada-respuesta';

/** RF-30B: marca `contenido.variable` del nodo. */
export interface VariableNodo {
  readonly codigo: string;
}

/**
 * Lee la variable taxonómica que captura el nodo. Es un objeto con un único
 * código, así que un nodo captura como máximo una variable. Igual que
 * `capturaPerfil` (RF-27B), la designa el árbol, nunca el estudiante.
 */
export function extraerVariableNodo(
  contenido: Record<string, unknown>,
): VariableNodo | null {
  const { variable } = contenido;
  if (variable === undefined || variable === null) return null;
  if (
    !esObjetoRespuesta(variable) ||
    typeof variable.codigo !== 'string' ||
    !CODIGO_VARIABLE.test(variable.codigo)
  )
    return configuracion('Variable taxonómica del nodo mal configurada.');
  return { codigo: variable.codigo };
}

/** Validación de administración: la marca mal formada es un 422. */
export function validarVariableNodo(
  contenido: Record<string, unknown>,
): VariableNodo | null {
  try {
    return extraerVariableNodo(contenido);
  } catch (error: unknown) {
    if (error instanceof ConfiguracionRespuestaInvalida)
      throw new VariableNodoInvalidaException();
    throw error;
  }
}
