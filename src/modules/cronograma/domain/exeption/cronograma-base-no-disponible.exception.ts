import { NotFoundException } from '@nestjs/common';

export class CronogramaBaseNoDisponibleException extends NotFoundException {
  constructor() {
    super('No se encontró un cronograma base disponible para asignar.');
  }
}
