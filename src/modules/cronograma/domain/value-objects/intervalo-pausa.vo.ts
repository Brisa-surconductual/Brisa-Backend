import { FechasPausaInvalidasException } from '../exeption/fechas-pausa-invalidas.exception';

export class IntervaloPausaVO {
  constructor(
    readonly fechaInicio: Date,
    readonly fechaFin: Date,
  ) {
    if (
      Number.isNaN(fechaInicio.getTime()) ||
      Number.isNaN(fechaFin.getTime()) ||
      fechaFin < fechaInicio
    ) {
      throw new FechasPausaInvalidasException();
    }
  }
}
