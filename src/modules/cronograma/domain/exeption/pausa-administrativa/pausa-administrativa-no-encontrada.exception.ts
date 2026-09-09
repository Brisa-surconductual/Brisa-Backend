import { NotFoundException } from '@nestjs/common';

export class PausaAdministrativaNoEncontradaException extends NotFoundException {
  constructor() {
    super(
      'La pausa administrativa no fue encontrada para el usuario indicado.',
    );
  }
}
