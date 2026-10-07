import { UnprocessableEntityException } from '@nestjs/common';

export class DatosEventoContenidoInvalidosException extends UnprocessableEntityException {
  constructor() {
    super('Los datos del cambio de estado son incompletos o inválidos.');
  }
}
