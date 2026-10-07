import { BadRequestException } from '@nestjs/common';

export class MetadatosRecursoNoCoincidenException extends BadRequestException {
  constructor() {
    super(
      'El MIME type o el tamaño informado no coincide con el archivo almacenado.',
    );
  }
}
