import { isISO8601 } from 'class-validator';

/**
 * Fecha de consolidación de un agregado: ISO 8601 estricta y con zona horaria
 * explícita (`Z` u offset). Cualquier otro valor se descarta (`null`).
 */
export function fechaAgregado(fecha: unknown): string | null {
  return typeof fecha === 'string' &&
    /(?:Z|[+-]\d{2}:\d{2})$/u.test(fecha) &&
    isISO8601(fecha, { strict: true, strictSeparator: true }) &&
    Number.isFinite(Date.parse(fecha))
    ? fecha
    : null;
}
