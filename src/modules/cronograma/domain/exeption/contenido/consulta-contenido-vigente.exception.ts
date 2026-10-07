import { InternalServerErrorException } from '@nestjs/common';

export class ConsultaContenidoVigenteException extends InternalServerErrorException {
  constructor() {
    super(
      'No fue posible consultar el contenido vigente en este momento. Intente nuevamente más tarde.',
    );
  }
}
