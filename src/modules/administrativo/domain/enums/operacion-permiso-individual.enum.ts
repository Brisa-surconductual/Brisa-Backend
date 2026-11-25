/** Operaciones auditadas sobre permisos individuales (RF-04). */
export const OperacionPermisoIndividual = {
  OTORGAR: 'OTORGAR',
  REVOCAR: 'REVOCAR',
} as const;

export type OperacionPermisoIndividual =
  (typeof OperacionPermisoIndividual)[keyof typeof OperacionPermisoIndividual];
