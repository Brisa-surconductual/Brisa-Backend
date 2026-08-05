import { ForbiddenException } from '@nestjs/common';

export class AlcanceSesionInsuficienteException extends ForbiddenException {
  constructor() {
    super(
      'La sesión actual no tiene alcance para acceder a esta funcionalidad.',
    );
  }
}
