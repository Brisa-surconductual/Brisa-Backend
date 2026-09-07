import { NotFoundException } from '@nestjs/common';

export class CronogramaUsuarioNoAsignadoException extends NotFoundException {
  constructor() {
    super('El usuario no tiene un cronograma asignado.');
  }
}
