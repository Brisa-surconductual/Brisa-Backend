/** Severidad con la que se registra una acción en la bitácora (RF-123). */
export const SeveridadAuditoria = {
  BAJA: 'BAJA',
  MEDIA: 'MEDIA',
  ALTA: 'ALTA',
} as const;

export type SeveridadAuditoria =
  (typeof SeveridadAuditoria)[keyof typeof SeveridadAuditoria];
