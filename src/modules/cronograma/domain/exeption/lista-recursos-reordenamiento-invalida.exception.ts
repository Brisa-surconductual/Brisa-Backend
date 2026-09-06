import { BadRequestException } from '@nestjs/common';

export class ListaRecursosReordenamientoInvalidaException extends BadRequestException {
  constructor() {
    super(
      'La lista debe contener todos y únicamente los recursos del contenido.',
    );
  }
}
