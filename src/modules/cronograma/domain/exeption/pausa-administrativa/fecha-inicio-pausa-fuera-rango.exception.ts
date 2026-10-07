import { UnprocessableEntityException } from '@nestjs/common';

export class FechaInicioPausaFueraRangoException extends UnprocessableEntityException {
  constructor() {
    super(
      'La fecha de inicio de la pausa debe encontrarse dentro del rango del cronograma activo del usuario.',
    );
  }
}
