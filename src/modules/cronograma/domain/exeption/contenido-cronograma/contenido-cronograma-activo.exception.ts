import { ConflictException } from '@nestjs/common';

export class ContenidoCronogramaActivoException extends ConflictException {
  constructor() {
    super(
      'No se puede modificar un contenido asociado a un cronograma activo.',
    );
  }
}
