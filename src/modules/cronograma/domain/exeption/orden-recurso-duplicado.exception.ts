import { ConflictException } from '@nestjs/common';

export class OrdenRecursoDuplicadoException extends ConflictException {
  constructor() {
    super('El orden del bloque ya está asignado dentro del contenido.');
  }
}
