import { DatosLineaBaseInvalidosException } from '../exceptions/usuario.exceptions';

export class FrecuenciaConsumo {
  constructor(private readonly frecuenciaConsumo: number) {
    if (!Number.isInteger(frecuenciaConsumo) || frecuenciaConsumo < 0) {
      throw new DatosLineaBaseInvalidosException(
        'La frecuencia de consumo debe ser un número entero no negativo.',
      );
    }
  }

  getValue(): number {
    return this.frecuenciaConsumo;
  }
}
