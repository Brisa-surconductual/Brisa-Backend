import type { NO_CALCULABLE } from '../../domain/policies/tasa-notificacion.policy';

/** Tasa calculada por M07 (RF-100); puede venir marcada como no calculable. */
export type TasaM07 = number | typeof NO_CALCULABLE | null;

/** Periodo consultado (`YYYY-MM-DD`); null = sin límite (todo el programa). */
export interface PeriodoNotificaciones {
  fecha_inicio: string | null;
  fecha_fin: string | null;
}

/**
 * Interacción de un usuario con las notificaciones en el periodo, tal como la
 * expone M07: totales de RF-95 / RF-98 / RF-99 y tasas de RF-100.
 */
export interface InteraccionNotificacionesM07 {
  /** Usuario al que pertenece el historial; M-8 exige que sea el solicitado. */
  id_usuario: string;
  total_notificaciones_enviadas: number;
  total_notificaciones_entregadas: number;
  total_notificaciones_abiertas: number;
  total_notificaciones_descartadas: number;
  total_sesiones_desde_notificacion: number;
  /** abiertas / entregadas. */
  tasa_apertura: TasaM07;
  /** sesiones desde notificación / abiertas. */
  tasa_conversion: TasaM07;
  /** descartadas / entregadas. */
  tasa_descarte: TasaM07;
}

/**
 * RF-131: lectura del historial de interacción con notificaciones de un
 * usuario expuesto por M07. Filtra estrictamente por `id_usuario`.
 */
export abstract class NotificacionesIndividualPort {
  /** null si M07 no tiene historial del usuario (204). */
  abstract obtenerInteraccion(
    idUsuario: string,
    periodo: PeriodoNotificaciones,
  ): Promise<InteraccionNotificacionesM07 | null>;
}
