import { BadRequestException } from '@nestjs/common';

export class DatosRecursoIncoherentesException extends BadRequestException {
  constructor() {
    super('Los datos del recurso no son coherentes con el tipo seleccionado.');
  }
}
