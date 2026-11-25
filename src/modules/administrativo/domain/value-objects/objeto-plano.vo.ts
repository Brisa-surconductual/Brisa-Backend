/** Un valor externo es un objeto plano (no nulo ni arreglo) inspeccionable por clave. */
export function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}
