import { isISO8601 } from 'class-validator';

export type TipoVistaAgregada = 'CONDUCTUAL' | 'NARRATIVA' | 'NOTIFICACIONES';

export interface DatosVistaAgregada {
  fecha_actualizacion: string;
}

export interface VistaAgregada<T extends DatosVistaAgregada> {
  id_cohorte: string;
  estado: 'DISPONIBLE' | 'DESACTUALIZADA' | 'NO_DISPONIBLE';
  estado_agregacion: 'ACTUALIZADO' | 'PENDIENTE' | 'ERROR_ACTUALIZACION';
  ultimo_timestamp_disponible: string | null;
  motivo_sin_datos: 'SIN_CONSOLIDAR' | 'AGREGADO_SUPRIMIDO' | null;
  mensaje: string | null;
  datos: T | null;
}

export function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

export function esSnapshotSuprimido(valor: unknown): boolean {
  return esObjeto(valor) && valor.estado === 'SUPRIMIDO';
}

export function fechaAgregado(fecha: unknown): string | null {
  return typeof fecha === 'string' &&
    /(?:Z|[+-]\d{2}:\d{2})$/u.test(fecha) &&
    isISO8601(fecha, { strict: true, strictSeparator: true }) &&
    Number.isFinite(Date.parse(fecha))
    ? fecha
    : null;
}

export function conteo(valor: unknown): number | null {
  return typeof valor === 'number' && Number.isSafeInteger(valor) && valor >= 0
    ? valor
    : null;
}

export function tasaAgregada(valor: unknown): number | null {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : null;
}
