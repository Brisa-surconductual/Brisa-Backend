import {NotFoundException } from '@nestjs/common';

export class ContenidoNoAsociadoException extends NotFoundException {
  constructor() {
    super('El contenido no está asociado a una unidad temporal del cronograma.');
  }
}

