import { BadRequestException } from '@nestjs/common';

export class FechasInconsistentesException extends BadRequestException {
  constructor() {
    super('La fecha de inicio debe ser menor que la fecha de fin.');
  }
}