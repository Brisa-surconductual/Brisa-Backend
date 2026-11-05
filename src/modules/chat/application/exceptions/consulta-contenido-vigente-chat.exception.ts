import { InternalServerErrorException } from '@nestjs/common';

export class ConsultaContenidoVigenteChatException extends InternalServerErrorException {
  constructor() {
    super('No fue posible consultar el contenido vigente para el chat.');
  }
}
