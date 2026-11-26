/** Estado global del panel principal administrativo (RF-140). */
export const EstadoDashboard = {
  DISPONIBLE: 'DISPONIBLE',
  PARCIAL: 'PARCIAL',
  DESACTUALIZADO: 'DESACTUALIZADO',
  NO_DISPONIBLE: 'NO_DISPONIBLE',
  SIN_COHORTE_ACTIVA: 'SIN_COHORTE_ACTIVA',
} as const;

export type EstadoDashboard =
  (typeof EstadoDashboard)[keyof typeof EstadoDashboard];
