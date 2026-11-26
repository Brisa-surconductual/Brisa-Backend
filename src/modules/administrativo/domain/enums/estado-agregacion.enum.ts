/** Resultado del último intento de consolidar una vista agregada. */
export const EstadoAgregacion = {
  ACTUALIZADO: 'ACTUALIZADO',
  PENDIENTE: 'PENDIENTE',
  ERROR_ACTUALIZACION: 'ERROR_ACTUALIZACION',
} as const;

export type EstadoAgregacion =
  (typeof EstadoAgregacion)[keyof typeof EstadoAgregacion];
