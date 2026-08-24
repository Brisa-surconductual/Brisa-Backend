import { UnprocessableEntityException } from '@nestjs/common';

export class SolapamientoUnidadTemporalException extends UnprocessableEntityException {
  constructor() {
    super('Esta unidad temporal se solapa con otra unidad temporal existente en el cronograma');
  }
}
