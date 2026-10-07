import { ConflictException } from '@nestjs/common';

export class EventoContenidoDuplicadoException extends ConflictException {
  constructor() {
    super('El evento ya ha sido generado para este cambio de estado.');
  }
}
