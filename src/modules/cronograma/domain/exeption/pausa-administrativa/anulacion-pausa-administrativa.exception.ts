import { InternalServerErrorException } from '@nestjs/common';

export class AnulacionPausaAdministrativaException extends InternalServerErrorException {
  constructor() {
    super(
      'No fue posible anular la pausa administrativa en este momento. Intente nuevamente más tarde.',
    );
  }
}
