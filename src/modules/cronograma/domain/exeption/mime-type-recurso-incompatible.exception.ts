import { BadRequestException } from '@nestjs/common';

export class MimeTypeRecursoIncompatibleException extends BadRequestException {
  constructor() {
    super('El MIME type no corresponde con el tipo de recurso seleccionado.');
  }
}
