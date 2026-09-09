import { InternalServerErrorException } from '@nestjs/common';

export class ValidacionConsistenciaCronogramaException extends InternalServerErrorException {
  constructor() {
    super('No fue posible validar la consistencia del cronograma.');
  }
}