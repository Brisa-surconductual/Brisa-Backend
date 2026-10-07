import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';

export class CronogramaNoEncontradoException extends NotFoundException {
  constructor() {
    super('Cronograma no encontrado.');
  }
}