import { ForbiddenException } from '@nestjs/common';

export class RecursoContenidoActivoException extends ForbiddenException {
  constructor() {
    super('No se puede modificar un recurso de un cronograma activo.');
  }
}
