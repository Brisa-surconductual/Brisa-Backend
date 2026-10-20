import { BadRequestException } from '@nestjs/common';

export class ActualizacionRecursoInvalidaException extends BadRequestException {
  constructor(
    mensaje = 'Los campos de actualización del recurso no son válidos.',
  ) {
    super(mensaje);
  }
}
