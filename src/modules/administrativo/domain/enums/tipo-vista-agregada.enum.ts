/** Dimensiones de las vistas agregadas por cohorte (RF-132 a RF-134). */
export const TipoVistaAgregada = {
  CONDUCTUAL: 'CONDUCTUAL',
  NARRATIVA: 'NARRATIVA',
  NOTIFICACIONES: 'NOTIFICACIONES',
} as const;

export type TipoVistaAgregada =
  (typeof TipoVistaAgregada)[keyof typeof TipoVistaAgregada];
