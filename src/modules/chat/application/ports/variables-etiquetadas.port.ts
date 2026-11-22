import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/perfil-clinico.enum';
import { EstadoEtiquetado } from '../../domain/enums/tipo-valor-variable.enum';
import { PENDIENTE_PERFIL } from './perfil-clinico-vigente.port';

export interface VariableSesionEtiquetada {
  codigo: string;
  valor: number | string | boolean;
  etiqueta: string | null;
}

/** RF-30B → RF-53: variables etiquetadas de una sesión. */
export interface VariablesEtiquetadasSesion {
  id_usuario: string;
  id_sesion: string;
  /** Última interacción etiquetada de la sesión. */
  id_interaccion: string;
  timestamp_interaccion: string;
  modalidad_intervencion: ModalidadConversacional;
  perfil_clinico: {
    tipo_dependencia: TipoDependenciaClinica | typeof PENDIENTE_PERFIL;
    tipo_craving: TipoCravingClinico | typeof PENDIENTE_PERFIL;
  };
  /** En orden de secuencia; una multiselección aporta un elemento por opción. */
  variables_sesion: VariableSesionEtiquetada[];
  estado_etiquetado: EstadoEtiquetado;
  version_taxonomia: string;
}

/** Puerto interno que consume M-5 (RF-53). Sin ruta HTTP. */
export abstract class VariablesEtiquetadasPort {
  /** `null` si la sesión no tiene variables etiquetadas. */
  abstract listarPorSesion(
    idSesion: string,
  ): Promise<VariablesEtiquetadasSesion | null>;
}
