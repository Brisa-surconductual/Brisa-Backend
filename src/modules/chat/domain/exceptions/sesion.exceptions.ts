import { DomainException } from './domain.exception';

export class SesionNoReanudableException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super(
      'La sesión conversacional no se puede reanudar en su estado actual.',
      'SESION_NO_REANUDABLE',
    );
  }
}

export class SesionActivaExistenteException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super(
      'El usuario ya tiene una sesión conversacional activa o pausada.',
      'SESION_ACTIVA_EXISTENTE',
    );
  }
}
