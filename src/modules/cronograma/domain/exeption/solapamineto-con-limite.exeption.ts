import { ConflictException } from '@nestjs/common';


export class SolapamientoConLimiteException extends ConflictException {
  constructor(mensaje: string) {
    super(mensaje);
  }
}