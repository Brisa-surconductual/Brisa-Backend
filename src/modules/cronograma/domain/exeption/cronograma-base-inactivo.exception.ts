import { ConflictException } from '@nestjs/common';

export class CronogramaBaseInactivoException extends ConflictException {
  constructor() {
    super(
      'No es posible inicializar el cronograma porque no se encuentra activo.',
    );
  }
}
