import { UnauthorizedException } from '@nestjs/common';

export class SesionNoActivaException extends UnauthorizedException {
  constructor() {
    super('No existe una sesión activa. Por favor, inicie sesión nuevamente.');
  }
}
