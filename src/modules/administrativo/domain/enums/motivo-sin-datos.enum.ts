/** Motivo por el que una vista agregada no expone datos. */
export const MotivoSinDatos = {
  SIN_CONSOLIDAR: 'SIN_CONSOLIDAR',
  AGREGADO_SUPRIMIDO: 'AGREGADO_SUPRIMIDO',
} as const;

export type MotivoSinDatos =
  (typeof MotivoSinDatos)[keyof typeof MotivoSinDatos];
