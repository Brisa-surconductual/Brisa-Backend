import { ForbiddenException } from '@nestjs/common';

export class ModuloEventoNoAutorizadoException extends ForbiddenException {
  constructor() {
    super('El módulo no está autorizado para consumir este tipo de eventos.');
  }
}
