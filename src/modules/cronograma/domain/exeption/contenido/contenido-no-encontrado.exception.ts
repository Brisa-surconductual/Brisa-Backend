import { NotFoundException } from '@nestjs/common';

export class ContenidoNoEncontradoException extends NotFoundException {
  constructor() {
    super('El contenido psicoeducativo no existe.');
  }
}
