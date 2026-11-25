/** Disponibilidad de una vista agregada para el administrador. */
export const EstadoVistaAgregada = {
  DISPONIBLE: 'DISPONIBLE',
  DESACTUALIZADA: 'DESACTUALIZADA',
  NO_DISPONIBLE: 'NO_DISPONIBLE',
} as const;

export type EstadoVistaAgregada =
  (typeof EstadoVistaAgregada)[keyof typeof EstadoVistaAgregada];
