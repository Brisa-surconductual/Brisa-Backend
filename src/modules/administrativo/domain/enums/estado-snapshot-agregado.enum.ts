/** Marca con la que se persiste un agregado suprimido por privacidad. */
export const EstadoSnapshotAgregado = {
  SUPRIMIDO: 'SUPRIMIDO',
} as const;

export type EstadoSnapshotAgregado =
  (typeof EstadoSnapshotAgregado)[keyof typeof EstadoSnapshotAgregado];
