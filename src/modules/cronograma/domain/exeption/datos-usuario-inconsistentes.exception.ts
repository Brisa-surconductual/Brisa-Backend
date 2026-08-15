import { UnprocessableEntityException } from '@nestjs/common';

export class DatosUsuarioInconsistentesException extends UnprocessableEntityException {
  constructor() {
    super('Los datos del usuario son inconsistentes o incompletos.');
  }
}
