import { Injectable } from '@nestjs/common';
import { ConsultaContenidoVigentePort } from '../../../cronograma/application/ports/consulta-contenido-vigente.port';
import { ContenidoVigenteChat } from '../../domain/entities/contenido-vigente/contenido-vigente-chat.entity';
import { ContenidoVigenteChatRepository } from '../../domain/repositories/contenido-vigente-chat.repository';
import { ContenidoVigenteChatMapper } from '../mappers/contenido-vigente-chat.mapper';

/**
 * Obtiene los contenidos vigentes del usuario desde la consulta del cronograma,
 * que es la fuente de esos datos, y los entrega como entidades del chat.
 */
@Injectable()
export class CronogramaContenidoVigenteChatRepository extends ContenidoVigenteChatRepository {
  constructor(private readonly cronograma: ConsultaContenidoVigentePort) {
    super();
  }

  async listarPorUsuario(idUsuario: string): Promise<ContenidoVigenteChat[]> {
    const contenidos = await this.cronograma.consultar(idUsuario, 'CHAT');

    return contenidos.map((contenido) =>
      ContenidoVigenteChatMapper.toDomain(contenido),
    );
  }
}
