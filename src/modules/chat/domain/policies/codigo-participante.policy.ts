/**
 * A7: formato del seudónimo de un participante, tal como lo genera
 * `administrativo.fn_obtener_codigo_participante`: `P-` y 8 caracteres
 * hexadecimales en mayúscula (p. ej. `P-1A2B3C4D`). Un UUID interno nunca es
 * un código válido.
 */
export const FORMATO_CODIGO_PARTICIPANTE = /^P-[0-9A-F]{8}$/;

/** Código en mayúscula si tiene el formato A7; si no, null. */
export function normalizarCodigoParticipante(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const codigo = valor.trim().toUpperCase();
  return FORMATO_CODIGO_PARTICIPANTE.test(codigo) ? codigo : null;
}
