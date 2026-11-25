/**
 * Estado de resolución de una alerta (RF-129). `ATENDIDA` proviene de la
 * gestión administrativa local (RF-147, `alertas_gestion_admin`).
 */
export const EstadoResolucionAlerta = {
  ACTIVA: 'ACTIVA',
  PENDIENTE: 'PENDIENTE',
  EN_REVISION: 'EN_REVISION',
  RESUELTA: 'RESUELTA',
  DESCARTADA: 'DESCARTADA',
  ATENDIDA: 'ATENDIDA',
} as const;

export type EstadoResolucionAlerta =
  (typeof EstadoResolucionAlerta)[keyof typeof EstadoResolucionAlerta];
