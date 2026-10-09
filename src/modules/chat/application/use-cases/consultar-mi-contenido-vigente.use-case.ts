import { HttpException, Injectable } from '@nestjs/common';
import { ConsultaContenidoVigenteChatException } from '../../domain/exeption/consulta-contenido-vigente-chat.exception';
import { ContenidoVigenteChatDtoResponse } from '../dto/contenido-vigente-chat.dto-response';
import { ContenidoVigenteChatPort } from '../ports/contenido-vigente-chat.port';

@Injectable()
export class ConsultarMiContenidoVigenteUseCase {
  constructor(private readonly contenidoVigente: ContenidoVigenteChatPort) {}

  async execute(idUsuario: string): Promise<ContenidoVigenteChatDtoResponse[]> {
    try {
      return await this.contenidoVigente.consultar(idUsuario);
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;
      throw new ConsultaContenidoVigenteChatException();
    }
  }
}
