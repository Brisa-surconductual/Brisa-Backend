import type {
  EstadoIntervencionSos,
  EstadoSesionAnteriorSos,
  NIVEL_CRAVING_SOS,
} from '../../domain/enums/intervencion-sos.enum';
import type { TipoCravingClinico } from '../../domain/enums/perfil-clinico.enum';
import type { EventoSesionFinalizada } from './evento-sesion-finalizada';

export const EVENTO_SOS_ACTIVADO = 'chat.sos-activado';
export const TIPO_EVENTO_SOS_ACTIVADO = 'CHAT_SOS_ACTIVADO';

/**
 * RF-43: evento de craving elevado para M05. Se escribe en el outbox de RF-39
 * al cerrar la intervención, con la duración real medida en el servidor.
 * Los cuatro campos del RF (`id_usuario`, `timestamp_craving`, `tipo_craving`,
 * `duracion_intervencion`) van tal cual; el resto cubre FA-1 y las entradas
 * del RF.
 */
export interface EventoSosActivado {
  id_evento: string;
  tipo: typeof TIPO_EVENTO_SOS_ACTIVADO;
  version: '1.0';
  id_usuario: string;
  id_intervencion: string;
  /** ISO 8601 UTC: momento de activación según el servidor. */
  timestamp_craving: string;
  tipo_craving: TipoCravingClinico | null;
  /** Segundos enteros, entre 0 y 60. */
  duracion_intervencion: number;
  estado_intervencion: Exclude<
    EstadoIntervencionSos,
    EstadoIntervencionSos.EN_CURSO
  >;
  nivel_craving: typeof NIVEL_CRAVING_SOS;
  estado_sesion_anterior: EstadoSesionAnteriorSos;
}

/** Eventos que Chat entrega a M05 por el outbox de RF-39. */
export type EventoSeguimientoChat = EventoSesionFinalizada | EventoSosActivado;
