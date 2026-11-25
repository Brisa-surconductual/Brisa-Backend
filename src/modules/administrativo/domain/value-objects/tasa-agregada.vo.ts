/** Tasa o promedio agregado válido: número finito; si no lo es, `null`. */
export function tasaAgregada(valor: unknown): number | null {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : null;
}
