import { BadRequestException } from '@nestjs/common';

export class CambioEstadoContenidoInvalidoException extends BadRequestException {
  constructor() {
    super('El cambio de estado no es válido según las reglas del sistema.');
  }
}
