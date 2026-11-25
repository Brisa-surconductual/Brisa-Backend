/** Estado con el que responde un módulo proveedor de agregados (M05, M06, M07). */
export const EstadoFuenteAgregada = {
  ACTUALIZADO: 'ACTUALIZADO',
  PENDIENTE: 'PENDIENTE',
  SUPRIMIDO: 'SUPRIMIDO',
  NO_DISPONIBLE: 'NO_DISPONIBLE',
} as const;

export type EstadoFuenteAgregada =
  (typeof EstadoFuenteAgregada)[keyof typeof EstadoFuenteAgregada];
