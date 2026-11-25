/** Cómo se persiste un registro de bitácora: en la transacción o encolado (RF-123). */
export const ModoRegistroAuditoria = {
  SINCRONO: 'SINCRONO',
  DIFERIDO: 'DIFERIDO',
} as const;

export type ModoRegistroAuditoria =
  (typeof ModoRegistroAuditoria)[keyof typeof ModoRegistroAuditoria];
