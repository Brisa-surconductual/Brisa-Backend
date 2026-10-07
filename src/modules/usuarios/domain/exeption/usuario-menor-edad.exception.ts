import { BadRequestException } from '@nestjs/common';

export class UsuarioMenorEdadException extends BadRequestException {
  constructor() {
    super('El usuario debe tener al menos 18 años cumplidos.');
  }
}
