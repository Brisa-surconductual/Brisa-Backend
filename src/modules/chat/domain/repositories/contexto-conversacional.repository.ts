import { PerfilClinicoConversacional } from '../entities/perfil-clinico/perfil-clinico-conversacional';
import { ModalidadConversacional } from '../enums/modalidad-conversacional-enum';

export abstract class ContextoConversacionalRepository {
  abstract obtenerModalidadVigente(
    idUsuario: string,
  ): Promise<ModalidadConversacional | null>;

  abstract obtenerPerfilClinico(
    idUsuario: string,
  ): Promise<PerfilClinicoConversacional | null>;
}
