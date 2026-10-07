import { ConflictException } from '@nestjs/common';

export class CronogramaUsuarioYaInicializadoException extends ConflictException {
  constructor() {
    super('El usuario ya tiene un cronograma inicializado.');
  }
}
