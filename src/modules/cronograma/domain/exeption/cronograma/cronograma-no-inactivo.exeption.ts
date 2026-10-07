import { UnprocessableEntityException } from '@nestjs/common';

export class CronogramaNoInactivoException extends UnprocessableEntityException {
  constructor() {
    super('El cronograma debe estar inactivo para poder validarse y activarse.');
  }
}