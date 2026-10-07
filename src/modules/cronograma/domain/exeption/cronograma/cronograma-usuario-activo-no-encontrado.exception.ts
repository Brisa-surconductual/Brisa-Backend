import { UnprocessableEntityException } from '@nestjs/common';

export class CronogramaUsuarioActivoNoEncontradoException extends UnprocessableEntityException {
  constructor() {
    super('El usuario seleccionado no tiene un cronograma activo asignado.');
  }
}
