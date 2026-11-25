/** Estados del ciclo de vida de una cohorte (RF-124). */
export const EstadoCohorte = {
  BORRADOR: 'BORRADOR',
  ACTIVA: 'ACTIVA',
  INACTIVA: 'INACTIVA',
} as const;

export type EstadoCohorte = (typeof EstadoCohorte)[keyof typeof EstadoCohorte];

/** Lista ordenada de estados, útil para validaciones de entrada. */
export const ESTADOS_COHORTE = [
  EstadoCohorte.BORRADOR,
  EstadoCohorte.ACTIVA,
  EstadoCohorte.INACTIVA,
] as const;
