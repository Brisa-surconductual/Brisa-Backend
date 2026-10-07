import { UnprocessableEntityException } from '@nestjs/common';

export class FechaInicioUsuarioNoRegistradaException extends UnprocessableEntityException {
  constructor() {
    super('El usuario no tiene una fecha de inicio registrada en el programa.');
  }
}
