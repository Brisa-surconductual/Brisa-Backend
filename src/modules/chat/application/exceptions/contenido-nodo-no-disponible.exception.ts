import { InternalServerErrorException } from '@nestjs/common';

export class ContenidoNodoNoDisponibleException extends InternalServerErrorException {
  constructor() {
    super({
      statusCode: 500,
      error: 'Internal Server Error',
      codigo: 'CONTENIDO_NO_DISPONIBLE',
      message: 'El contenido del nodo no está disponible.',
    });
  }
}
