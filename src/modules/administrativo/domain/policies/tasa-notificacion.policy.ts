/** Marca de una tasa que no se puede calcular (RF-100, RF-131). */
export const NO_CALCULABLE = 'NO_CALCULABLE' as const;

export type TasaPresentable = number | typeof NO_CALCULABLE;

/**
 * RF-131: M-8 presenta las tasas que calcula M07 (RF-100), sin recalcularlas.
 * Una tasa se presenta como NO_CALCULABLE si:
 * - M07 no la entrega o la marca como NO_CALCULABLE (o no es un número finito);
 * - su denominador según RF-100 es cero (entregadas para apertura y descarte,
 *   abiertas para conversión), aunque M07 enviara un valor.
 */
export function tasaPresentable(
  tasa: number | typeof NO_CALCULABLE | null | undefined,
  denominador: number,
): TasaPresentable {
  if (typeof tasa !== 'number' || !Number.isFinite(tasa)) return NO_CALCULABLE;
  if (!Number.isFinite(denominador) || denominador <= 0) return NO_CALCULABLE;
  return tasa;
}
