import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/perfil-clinico.enum';

export const PENDIENTE_PERFIL = 'PENDIENTE_PERFIL';

export interface PerfilClinicoVigente {
  id_usuario: string;
  tipo_dependencia: TipoDependenciaClinica | typeof PENDIENTE_PERFIL;
  tipo_craving: TipoCravingClinico | typeof PENDIENTE_PERFIL;
  modalidad_terapeutica_activa: ModalidadConversacional;
  estado_perfil_clinico: 'ACTIVO' | 'PENDIENTE' | 'NO_CLASIFICADO';
  fecha_clasificacion: Date | null;
  fuente_clasificacion: 'CHAT';
}

export abstract class PerfilClinicoVigentePort {
  abstract obtener(idUsuario: string): Promise<PerfilClinicoVigente>;
}
