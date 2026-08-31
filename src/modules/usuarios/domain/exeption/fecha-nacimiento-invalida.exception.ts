import { BadRequestException } from '@nestjs/common';

export class FechaNacimientoInvalidaException extends BadRequestException {
  constructor(
    mensaje = 'La fecha de nacimiento debe ser una fecha válida y no futura.',
  ) {
    super(mensaje);
  }
}
