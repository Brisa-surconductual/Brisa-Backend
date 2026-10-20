import {
  ModalidadConversacional,
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../enums/arbol-conversacional.enums';

export interface PerfilClinicoConversacional {
  tipoDependencia: TipoDependenciaClinica | null;
  tipoCraving: TipoCravingClinico | null;
  completo: boolean;
}

export abstract class ContextoConversacionalRepository {
  abstract obtenerModalidadVigente(
    idUsuario: string,
  ): Promise<ModalidadConversacional | null>;

  abstract obtenerPerfilClinico(
    idUsuario: string,
  ): Promise<PerfilClinicoConversacional | null>;
}
