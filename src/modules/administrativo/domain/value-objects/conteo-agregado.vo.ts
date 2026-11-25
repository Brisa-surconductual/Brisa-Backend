/** Conteo agregado válido: entero seguro no negativo; si no lo es, `null`. */
export function conteo(valor: unknown): number | null {
  return typeof valor === 'number' && Number.isSafeInteger(valor) && valor >= 0
    ? valor
    : null;
}
