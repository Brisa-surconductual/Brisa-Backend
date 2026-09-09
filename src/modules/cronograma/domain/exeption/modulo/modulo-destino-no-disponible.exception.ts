import { NotFoundException } from '@nestjs/common';

export class ModuloDestinoNoDisponibleException extends NotFoundException {
  constructor() {
    super('Uno o más módulos destino no existen o están inactivos.');
  }
}
