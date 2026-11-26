import { DimensionPerfilClinico } from '../enums/perfil-clinico.enum';

/** Resultado de comprobar que el árbol grupal captura cada dimensión del perfil (RF-25 / RF-27B). */
export interface DiagnosticoCapturaPerfil {
  readonly dimensiones_ausentes: DimensionPerfilClinico[];
  readonly dimensiones_duplicadas: DimensionPerfilClinico[];
  /** Captura legado cuyas opciones no son exactamente el dominio clínico. */
  readonly dimensiones_valores_invalidos: DimensionPerfilClinico[];
  /** Captura por valor a la que le falta algún valor de la dimensión. */
  readonly dimensiones_valores_faltantes: {
    dimension: DimensionPerfilClinico;
    valores_faltantes: string[];
  }[];
}
