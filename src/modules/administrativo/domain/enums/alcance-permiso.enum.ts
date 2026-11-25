/** Alcance de un permiso explícito de acceso individual (RF-04, RF-145). */
export const AlcancePermiso = {
  ACCESO_INDIVIDUAL: 'ACCESO_INDIVIDUAL',
  PROGRESION_NARRATIVA: 'PROGRESION_NARRATIVA',
} as const;

export type AlcancePermiso =
  (typeof AlcancePermiso)[keyof typeof AlcancePermiso];
