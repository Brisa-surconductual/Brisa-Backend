import { BadRequestException } from '@nestjs/common';

export class RecursoSinModuloDestinoException extends BadRequestException {
  constructor() {
    super('El recurso debe tener al menos un módulo destino asignado.');
  }
}
