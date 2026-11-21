import type { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';
import type {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/perfil-clinico.enum';

export const EVENTO_SESION_FINALIZADA = 'chat.sesion-finalizada';
export const TIPO_EVENTO_SESION_FINALIZADA = 'CHAT_SESION_FINALIZADA';

export interface EventoSesionFinalizada {
  id_evento: string;
  tipo: typeof TIPO_EVENTO_SESION_FINALIZADA;
  version: '1.0';
  id_usuario: string;
  id_sesion: string;
  modalidad: ModalidadConversacional;
  tipo_dependencia: TipoDependenciaClinica | null;
  tipo_craving: TipoCravingClinico | null;
  origen_evento: 'CIERRE_SESION' | 'SINCRONIZACION_OFFLINE';
  timestamp: string;
}
