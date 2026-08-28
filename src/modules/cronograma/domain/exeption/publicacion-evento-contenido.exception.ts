import { InternalServerErrorException } from '@nestjs/common';

export class PublicacionEventoContenidoException extends InternalServerErrorException {
  constructor() {
    super(
      'No fue posible generar el evento en este momento. Intente nuevamente más tarde.',
    );
  }
}
