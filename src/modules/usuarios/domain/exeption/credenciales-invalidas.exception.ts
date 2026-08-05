import { UnauthorizedException } from '@nestjs/common';

export class CredencialesInvalidasException extends UnauthorizedException {
  constructor() {
    super(
      'Credenciales inválidas. Verifique su correo electrónico y contraseña.',
    );
  }
}
