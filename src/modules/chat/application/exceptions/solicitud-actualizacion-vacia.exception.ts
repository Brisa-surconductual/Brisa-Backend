import { BadRequestException } from '@nestjs/common';

export class SolicitudActualizacionVaciaException extends BadRequestException {
  constructor() {
    super('Debe proporcionar al menos un campo para actualizar.');
  }
}
