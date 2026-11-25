import { BadRequestException } from '@nestjs/common';

/** El límite de paginación de la bitácora está fuera de rango (RF-123). */
export class LimiteBitacoraInvalidoException extends BadRequestException {
  constructor() {
    super('El límite debe estar entre 1 y 100.');
  }
}
