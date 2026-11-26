/** Resultado con el que termina una acción auditada (RF-123). */
export const EstadoAccion = {
  EXITOSA: 'EXITOSA',
  FALLIDA: 'FALLIDA',
  DENEGADA: 'DENEGADA',
} as const;

export type EstadoAccion = (typeof EstadoAccion)[keyof typeof EstadoAccion];
