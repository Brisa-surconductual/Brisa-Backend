/** Operaciones de gestión de una cohorte que se auditan (RF-124). */
export const OperacionCohorte = {
  CREAR: 'CREAR',
  EDITAR: 'EDITAR',
  ACTIVAR: 'ACTIVAR',
  INACTIVAR: 'INACTIVAR',
} as const;

export type OperacionCohorte =
  (typeof OperacionCohorte)[keyof typeof OperacionCohorte];
