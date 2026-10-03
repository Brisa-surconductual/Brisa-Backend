import { BadRequestException } from '@nestjs/common';

export class FechaInicioNoHayaPasoException extends BadRequestException {

  constructor() {
    super('La fecha de inicio ya paso');
  }
}