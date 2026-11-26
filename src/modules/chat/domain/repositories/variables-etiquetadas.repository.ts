import { ElementoEtiquetado } from '../entities/taxonomia/variable-taxonomia.entity';
import { ModalidadConversacional } from '../enums/modalidad-conversacional-enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../enums/perfil-clinico.enum';
import { EstadoEtiquetado } from '../enums/tipo-valor-variable.enum';

/** RF-30B: perfil clínico vigente en el momento de etiquetar. */
export interface SnapshotPerfilEtiquetado {
  readonly tipoDependencia: TipoDependenciaClinica | null;
  readonly tipoCraving: TipoCravingClinico | null;
}

/** RF-30B: fila inmutable de `chat.variables_etiquetadas`. */
export interface VariableEtiquetada {
  readonly idInteraccion: string;
  readonly idSesion: string;
  readonly idUsuario: string;
  readonly idNodo: string;
  readonly idVariable: string;
  readonly codigoVariable: string;
  readonly valor: unknown;
  readonly elementos: readonly ElementoEtiquetado[];
  readonly modalidad: ModalidadConversacional;
  readonly perfil: SnapshotPerfilEtiquetado;
  readonly estado: EstadoEtiquetado;
  readonly versionTaxonomia: string;
  readonly secuencia: number;
  readonly timestampInteraccion: Date;
}

/** Lectura de las variables etiquetadas (RF-53). */
export abstract class VariablesEtiquetadasRepository {
  /** Variables etiquetadas de la sesión, en orden de secuencia. */
  abstract listarPorSesion(idSesion: string): Promise<VariableEtiquetada[]>;
}
