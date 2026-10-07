import { InternalServerErrorException } from '@nestjs/common';

export class CalculoUbicacionTemporalException extends InternalServerErrorException {
  constructor() {
    super(
      'No fue posible calcular la ubicación temporal del usuario en este momento. Intente nuevamente más tarde.',
    );
  }
}
