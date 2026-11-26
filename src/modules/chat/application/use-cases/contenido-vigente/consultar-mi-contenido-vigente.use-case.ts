import { HttpException, Injectable } from '@nestjs/common';
import { DomainException } from '../../../domain/exceptions';
import { ContenidoVigenteChatRepository } from '../../../domain/repositories/contenido-vigente-chat.repository';
import { ContenidoVigenteChatDtoResponse } from '../../dto/contenido-vigente-chat.dto-response';
import { ConsultaContenidoVigenteChatException } from '../../exceptions/consulta-contenido-vigente-chat.exception';

/** Contenidos del cronograma vigentes para el usuario autenticado. */
@Injectable()
export class ConsultarMiContenidoVigenteUseCase {
  constructor(private readonly contenidos: ContenidoVigenteChatRepository) {}

  async execute(idUsuario: string): Promise<ContenidoVigenteChatDtoResponse[]> {
    try {
      return (await this.contenidos.listarPorUsuario(idUsuario)).map(
        (contenido) => ContenidoVigenteChatDtoResponse.crear(contenido),
      );
    } catch (error: unknown) {
      if (error instanceof HttpException || error instanceof DomainException)
        throw error;
      throw new ConsultaContenidoVigenteChatException();
    }
  }
}
