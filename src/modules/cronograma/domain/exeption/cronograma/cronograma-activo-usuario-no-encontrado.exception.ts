import { NotFoundException } from '@nestjs/common';

export class CronogramaActivoUsuarioNoEncontradoException extends NotFoundException {
  constructor() {
    super('El usuario no tiene un cronograma activo asignado.');
  }
}
