import { InternalServerErrorException } from '@nestjs/common';

export class ConsultaUbicacionesTemporalesParticipantesException extends InternalServerErrorException {
  constructor() {
    super(
      'No fue posible consultar la ubicación temporal de los participantes en este momento. Intente nuevamente más tarde.',
    );
  }
}
