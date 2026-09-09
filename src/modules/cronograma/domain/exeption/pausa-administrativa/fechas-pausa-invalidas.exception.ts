import { BadRequestException } from '@nestjs/common';

export class FechasPausaInvalidasException extends BadRequestException {
  constructor() {
    super(
      'La fecha de finalización de la pausa no puede ser anterior a la fecha de inicio.',
    );
  }
}
