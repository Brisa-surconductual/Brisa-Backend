import { NotFoundException  } from '@nestjs/common';

export class ContenidoCronogramaContenidoNoEncontradoException extends NotFoundException  {
  constructor() {
    super(
      'Contenido No encontrado',
    );
  }
}
