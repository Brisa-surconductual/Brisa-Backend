import { ForbiddenException } from '@nestjs/common';

export class ContenidoNoProgramadoException extends ForbiddenException {
  constructor() {
    super('Solo se puede reprogramar la disponibilidad de contenido en estado PROGRAMADO.');
  }
}