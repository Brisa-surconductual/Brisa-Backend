export type EstadoParticipanteCohorte =
  'ACTIVO' | 'INACTIVO' | 'PENDIENTE_VALIDACION';

export type OperacionParticipanteCohorte =
  'ASIGNAR_PARTICIPANTES' | 'RETIRAR_PARTICIPANTE';

export interface ParticipanteCohorte {
  codigo_participante: string;
  estado: EstadoParticipanteCohorte;
  estado_registro: string;
  estado_consentimiento: string;
  estado_linea_base: string;
  motivos_pendiente: string[];
}
