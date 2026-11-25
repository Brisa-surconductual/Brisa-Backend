/** Tendencia de consumo expuesta por M05 (RF-77, RF-128). */
export const TendenciaConsumo = {
  REDUCCION: 'REDUCCION',
  ESTABLE: 'ESTABLE',
  INCREMENTO: 'INCREMENTO',
  NO_CALCULADA: 'NO_CALCULADA',
} as const;

export type TendenciaConsumo =
  (typeof TendenciaConsumo)[keyof typeof TendenciaConsumo];
