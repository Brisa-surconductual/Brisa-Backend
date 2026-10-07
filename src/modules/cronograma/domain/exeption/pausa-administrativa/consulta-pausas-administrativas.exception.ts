import { InternalServerErrorException } from '@nestjs/common';

export class ConsultaPausasAdministrativasException extends InternalServerErrorException {
  constructor() {
    super(
      'No fue posible consultar las pausas administrativas en este momento. Intente nuevamente más tarde.',
    );
  }
}
