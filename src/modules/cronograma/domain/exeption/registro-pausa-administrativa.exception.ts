import { InternalServerErrorException } from '@nestjs/common';

export class RegistroPausaAdministrativaException extends InternalServerErrorException {
  constructor() {
    super(
      'No fue posible registrar la pausa administrativa en este momento. Intente nuevamente más tarde.',
    );
  }
}
