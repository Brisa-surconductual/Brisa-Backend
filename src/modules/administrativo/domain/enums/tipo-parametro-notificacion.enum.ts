/** Parámetros globales de M07 configurables desde M-8 (RF-137). */
export const TipoParametroNotificacion = {
  /** RF-87: límite diario de envíos por día hábil y por fin de semana. */
  LIMITE_DIARIO: 'LIMITE_DIARIO',
  /** RF-88: intervalo mínimo entre notificaciones consecutivas. */
  INTERVALO_MINIMO: 'INTERVALO_MINIMO',
  /** RF-89: franjas horarias de entrega por segmento del día. */
  FRANJAS_HORARIAS: 'FRANJAS_HORARIAS',
} as const;

export type TipoParametroNotificacion =
  (typeof TipoParametroNotificacion)[keyof typeof TipoParametroNotificacion];

export function esTipoParametroNotificacion(
  valor: string,
): valor is TipoParametroNotificacion {
  return Object.values<string>(TipoParametroNotificacion).includes(valor);
}

/** Unidad con la que se registra cada parámetro en la bitácora. */
export const UNIDAD_PARAMETRO_NOTIFICACION: Record<
  TipoParametroNotificacion,
  string
> = {
  LIMITE_DIARIO: 'notificaciones_por_dia',
  INTERVALO_MINIMO: 'horas',
  FRANJAS_HORARIAS: 'hora_HH:MM_UTC-5',
};
