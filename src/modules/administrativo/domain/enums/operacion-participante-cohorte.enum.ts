/** Operaciones sobre participantes de una cohorte que se auditan (RF-125). */
export const OperacionParticipanteCohorte = {
  ASIGNAR_PARTICIPANTES: 'ASIGNAR_PARTICIPANTES',
  RETIRAR_PARTICIPANTE: 'RETIRAR_PARTICIPANTE',
} as const;

export type OperacionParticipanteCohorte =
  (typeof OperacionParticipanteCohorte)[keyof typeof OperacionParticipanteCohorte];
