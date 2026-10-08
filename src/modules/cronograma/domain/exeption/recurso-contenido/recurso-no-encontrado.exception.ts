import { NotFoundException } from '@nestjs/common';

export class RecursoNoEncontradoException extends NotFoundException {
  constructor() {
    super('El recurso de contenido no existe.');
  }
}
