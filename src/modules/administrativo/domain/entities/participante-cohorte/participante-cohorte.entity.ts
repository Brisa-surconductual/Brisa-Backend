import type { EstadoParticipanteCohorte } from '../../enums/estado-participante-cohorte.enum';

/** Participante seudonimizado dentro de una cohorte (RF-125). */
export interface ParticipanteCohorte {
  codigo_participante: string;
  estado: EstadoParticipanteCohorte;
  estado_registro: string;
  estado_consentimiento: string;
  estado_linea_base: string;
  motivos_pendiente: string[];
}
