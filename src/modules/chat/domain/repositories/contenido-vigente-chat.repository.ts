import { ContenidoVigenteChat } from '../entities/contenido-vigente/contenido-vigente-chat.entity';

export abstract class ContenidoVigenteChatRepository {
  /** Contenidos vigentes del usuario según su cronograma, destinados al chat. */
  abstract listarPorUsuario(idUsuario: string): Promise<ContenidoVigenteChat[]>;
}
