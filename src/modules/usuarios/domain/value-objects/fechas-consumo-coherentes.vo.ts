import { FechasConsumoIncoherentesException } from '../exceptions/usuario.exceptions';

export class FechasConsumoCoherentes {
  constructor(
    readonly fechaInicio: Date,
    readonly fechaUltimo: Date,
  ) {
    if (
      Number.isNaN(fechaInicio.getTime()) ||
      Number.isNaN(fechaUltimo.getTime()) ||
      fechaInicio > fechaUltimo ||
      fechaUltimo > new Date()
    ) {
      throw new FechasConsumoIncoherentesException();
    }
  }
}
