import { ConflictException } from '@nestjs/common';

export class ContenidoUnicaUnidadTemporalException extends ConflictException {
  constructor() {
    super(
      'Un contenido no puede estar asociado a más de una unidad temporal dentro del mismo cronograma.',
    );
  }
}
