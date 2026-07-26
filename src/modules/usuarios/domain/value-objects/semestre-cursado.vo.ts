import { DatosLineaBaseInvalidosException } from '../exceptions/usuario.exceptions';

export class SemestreCursado {
  constructor(private readonly semestreCursado: number) {
    if (
      !Number.isInteger(semestreCursado) ||
      semestreCursado < 1 ||
      semestreCursado > 20
    ) {
      throw new DatosLineaBaseInvalidosException(
        'El semestre cursado debe estar entre 1 y 20.',
      );
    }
  }

  getValue(): number {
    return this.semestreCursado;
  }
}
