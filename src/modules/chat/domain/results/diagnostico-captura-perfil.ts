import { DimensionPerfilClinico } from '../enums/perfil-clinico.enum';

/** Resultado de comprobar que el árbol grupal designa un nodo por dimensión (RF-25). */
export interface DiagnosticoCapturaPerfil {
  readonly dimensiones_ausentes: DimensionPerfilClinico[];
  readonly dimensiones_duplicadas: DimensionPerfilClinico[];
}
