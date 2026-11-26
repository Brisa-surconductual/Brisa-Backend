/** Estado de un participante dentro de su cohorte (RF-125). */
export const EstadoParticipanteCohorte = {
  ACTIVO: 'ACTIVO',
  INACTIVO: 'INACTIVO',
  PENDIENTE_VALIDACION: 'PENDIENTE_VALIDACION',
} as const;

export type EstadoParticipanteCohorte =
  (typeof EstadoParticipanteCohorte)[keyof typeof EstadoParticipanteCohorte];
