import { BadRequestException } from '@nestjs/common';

/** El cursor de paginación de la bitácora no es un UUID (RF-123). */
export class CursorBitacoraInvalidoException extends BadRequestException {
  constructor() {
    super('El cursor debe ser un UUID.');
  }
}
