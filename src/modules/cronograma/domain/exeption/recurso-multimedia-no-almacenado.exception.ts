import { BadRequestException } from '@nestjs/common';

export class RecursoMultimediaNoAlmacenadoException extends BadRequestException {
  constructor() {
    super(
      'El archivo no existe en el almacenamiento autorizado o aún no terminó de subir.',
    );
  }
}
