import { InternalServerErrorException } from '@nestjs/common';

export class InicializacionCronogramaPersistenciaException extends InternalServerErrorException {
  constructor() {
    super(
      'No fue posible inicializar el cronograma en este momento. Intente nuevamente más tarde.',
    );
  }
}
