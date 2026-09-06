import { NotFoundException  } from '@nestjs/common';

export class ContenidoCronogramaContenidoNoEncontradoException extends NotFoundException  {
  constructor() {
    super(
      'Asociasion de contenido con la unidad temporal no encontrado',
    );
  }
}
