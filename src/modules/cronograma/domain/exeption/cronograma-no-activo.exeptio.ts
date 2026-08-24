import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';

export class CronogramaNoActivoException extends UnprocessableEntityException {
  constructor() {
    super('El cronograma no está activo.');
  }
}