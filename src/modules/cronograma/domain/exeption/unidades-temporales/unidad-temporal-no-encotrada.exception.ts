import { NotFoundException  } from '@nestjs/common';

export class UnidadTemporalNoEncontradaException extends NotFoundException  {
  constructor() {
    super(
      'Unidad Temporal No encontrada',
    );
  }
}
