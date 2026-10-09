import { ContenidoVigenteChatDtoResponse } from '../dto/contenido-vigente-chat.dto-response';

export abstract class ContenidoVigenteChatPort {
  abstract consultar(
    idUsuario: string,
  ): Promise<ContenidoVigenteChatDtoResponse[]>;
}
