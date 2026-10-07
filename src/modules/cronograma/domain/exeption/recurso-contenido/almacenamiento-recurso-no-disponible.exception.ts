import { ServiceUnavailableException } from '@nestjs/common';

export class AlmacenamientoRecursoNoDisponibleException extends ServiceUnavailableException {
  constructor() {
    super('El almacenamiento de recursos no está disponible temporalmente.');
  }
}
