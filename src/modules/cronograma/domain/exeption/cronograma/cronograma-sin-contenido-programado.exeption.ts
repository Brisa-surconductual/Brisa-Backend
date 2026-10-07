import { UnprocessableEntityException } from '@nestjs/common';


export class CronogramaSinContenidoProgramadoException extends UnprocessableEntityException {
  constructor() {
    super('El cronograma no tiene contenido programado en ninguna de sus unidades temporales.');
  }
}