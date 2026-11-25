/** Fases de la progresión narrativa (RF-133). */
export const FaseNarrativa = {
  INICIO: 'INICIO',
  DESARROLLO: 'DESARROLLO',
  CIERRE: 'CIERRE',
} as const;

export type FaseNarrativa = (typeof FaseNarrativa)[keyof typeof FaseNarrativa];

/** Orden canónico de las fases narrativas. */
export const FASES_NARRATIVAS = [
  FaseNarrativa.INICIO,
  FaseNarrativa.DESARROLLO,
  FaseNarrativa.CIERRE,
] as const;
