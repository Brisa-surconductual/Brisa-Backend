import { UnprocessableEntityException } from '@nestjs/common';

export class CronogramaSinUnidadesTemporalesException extends UnprocessableEntityException {
  constructor() {
    super('El cronograma no tiene unidades temporales definidas.');
  }
}