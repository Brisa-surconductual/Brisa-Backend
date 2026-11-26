import { TipoEntradaRespuesta } from '../enums/tipo-entrada-respuesta.enum';
import { resolverTipoEntrada } from './regla-por-tipo-entrada';

/**
 * RF-25: la escala numérica avanza de 1 en 1, así que su `paso` se descarta
 * al guardar. El resto del contenido se conserva tal cual.
 */
export function normalizarContenidoNodo(
  contenido: Record<string, unknown>,
): Record<string, unknown> {
  if (resolverTipoEntrada(contenido) !== TipoEntradaRespuesta.ESCALA)
    return contenido;
  const entrada = contenido.entrada as Record<string, unknown>;
  if (!Object.hasOwn(entrada, 'paso')) return contenido;
  const resto = { ...entrada };
  delete resto.paso;
  return { ...contenido, entrada: resto };
}

/**
 * RF-25: las reglas de las transiciones de salida se derivan del tipo de
 * respuesta del nodo; si ese tipo cambia (o se quita o agrega la respuesta),
 * dejan de tener sentido.
 */
export function cambiaTipoRespuesta(
  antes: Record<string, unknown>,
  despues: Record<string, unknown>,
): boolean {
  return resolverTipoEntrada(antes) !== resolverTipoEntrada(despues);
}
