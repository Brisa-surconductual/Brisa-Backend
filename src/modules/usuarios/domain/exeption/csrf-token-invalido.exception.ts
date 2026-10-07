import { ForbiddenException } from '@nestjs/common';

export class CsrfTokenInvalidoException extends ForbiddenException {
  constructor() {
    super('La solicitud no contiene un token CSRF válido para la sesión.');
  }
}
