/** Niveles de progreso terapéutico de un participante. */
export const NivelProgreso = {
  INICIAL: 'INICIAL',
  EN_AVANCE: 'EN_AVANCE',
  AVANZADO: 'AVANZADO',
  COMPLETADO: 'COMPLETADO',
} as const;

export type NivelProgreso = (typeof NivelProgreso)[keyof typeof NivelProgreso];

/** Orden canónico de los niveles: rige la proyección y la exportación. */
export const NIVELES_PROGRESO = [
  NivelProgreso.INICIAL,
  NivelProgreso.EN_AVANCE,
  NivelProgreso.AVANZADO,
  NivelProgreso.COMPLETADO,
] as const;
