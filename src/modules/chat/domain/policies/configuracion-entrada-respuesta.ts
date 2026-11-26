export type ValorRespuesta = string | number | boolean | string[] | null;
export type ComprobarFormato = (patron: string, texto: string) => boolean;
export const esObjetoRespuesta = (
  valor: unknown,
): valor is Record<string, unknown> =>
  typeof valor === 'object' && valor !== null && !Array.isArray(valor);
export const respuestaVacia = (valor: unknown): boolean =>
  valor === null ||
  valor === undefined ||
  (typeof valor === 'string' && valor.trim() === '') ||
  (Array.isArray(valor) && valor.length === 0);
