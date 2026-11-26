import { ModalidadConversacional } from '../enums/modalidad-conversacional-enum';
import {
  DimensionPerfilClinico,
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../enums/perfil-clinico.enum';

export type DimensionPerfilCapturada =
  | {
      dimension: DimensionPerfilClinico.TIPO_DEPENDENCIA;
      valor: TipoDependenciaClinica;
    }
  | {
      dimension: DimensionPerfilClinico.TIPO_CRAVING;
      valor: TipoCravingClinico;
    };

export type SolicitudCapturaDimensionPerfil = DimensionPerfilCapturada & {
  idUsuario: string;
  idSesion: string;
  idNodo: string;
  modalidadSesion: ModalidadConversacional;
};

export interface ResultadoCapturaDimensionPerfil {
  aplicado: boolean;
  dimension: DimensionPerfilClinico;
  valorVigente: TipoDependenciaClinica | TipoCravingClinico;
  perfilCompleto: boolean;
}

/** Puerto interno, ligado a la misma transacción que procesa la respuesta. */
export abstract class PerfilClinicoRepository {
  abstract capturarDimension(
    solicitud: SolicitudCapturaDimensionPerfil,
  ): Promise<ResultadoCapturaDimensionPerfil>;
}
