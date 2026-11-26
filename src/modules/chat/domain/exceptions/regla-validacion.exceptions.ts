import { DomainException } from './domain.exception';

export class ReglaValidacionNoEncontradaException extends DomainException {
  readonly tipo = 'NO_ENCONTRADO';

  constructor() {
    super('La regla de validación indicada no existe.');
  }
}

export class ReglaValidacionInvalidaException extends DomainException {
  readonly tipo = 'SOLICITUD_INVALIDA';

  constructor(
    mensaje = 'La regla de validación contiene valores incoherentes.',
  ) {
    super(mensaje);
  }
}
