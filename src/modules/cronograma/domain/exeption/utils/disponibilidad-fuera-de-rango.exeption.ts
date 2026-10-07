import { ConflictException } from '@nestjs/common';

export class DisponibilidadFueraDeRangoException extends ConflictException {
  constructor() {
    super('La disponibilidad del contenido debe estar dentro del rango de la unidad temporal asignada.');
  }
}
