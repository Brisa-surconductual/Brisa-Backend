import { UnprocessableEntityException } from '@nestjs/common';

export class CronogramaSinUnidadesTemporalesException extends UnprocessableEntityException {
  constructor() {
    super(
      'El cronograma no cuenta con unidades temporales definidas para realizar el cálculo.',
    );
  }
}
