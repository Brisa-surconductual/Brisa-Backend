import { InternalServerErrorException } from '@nestjs/common';

export class ConsultaInformacionTemporalException extends InternalServerErrorException {
  constructor() {
    super(
      'No fue posible consultar la información temporal en este momento. Intente nuevamente más tarde.',
    );
  }
}
