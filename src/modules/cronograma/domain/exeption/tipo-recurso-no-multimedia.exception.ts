import { BadRequestException } from '@nestjs/common';

export class TipoRecursoNoMultimediaException extends BadRequestException {
  constructor() {
    super('Los recursos de texto no requieren una URL de subida.');
  }
}
