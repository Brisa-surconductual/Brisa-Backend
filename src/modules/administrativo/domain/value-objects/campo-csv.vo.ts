/** Valor de una celda del CSV antes de serializarla. */
export type CeldaCsv = string | number;

/** Texto que ocupa una celda cuando el indicador no está disponible (RF-144). */
export const SIN_DATO_CSV = 'No disponible';

/**
 * Serializa una celda según RFC 4180 y neutraliza la inyección de fórmulas:
 * un texto que inicia con `= + - @` (tras espacios) o con tabulador/salto de
 * línea se antepone con `'` y se entrecomilla.
 */
export function campoCsv(valor: CeldaCsv): string {
  if (typeof valor === 'number') return String(valor);

  const inicial = valor[0];
  const significativo = valor.trimStart()[0];
  const requiereProteccion =
    (inicial && '\t\r\n'.includes(inicial)) ||
    (significativo && '=+-@'.includes(significativo));
  const texto = requiereProteccion ? "'" + valor : valor;
  return requiereProteccion || /[",\r\n]/u.test(texto)
    ? '"' + texto.replaceAll('"', '""') + '"'
    : texto;
}
