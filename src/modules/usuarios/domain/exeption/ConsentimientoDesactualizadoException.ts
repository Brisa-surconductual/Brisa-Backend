import { ForbiddenException } from '@nestjs/common';

export class ConsentimientoDesactualizadoException extends ForbiddenException {
  constructor() {
    super('Debe aceptar la actualización del consentimiento para continuar.');
  }
}
