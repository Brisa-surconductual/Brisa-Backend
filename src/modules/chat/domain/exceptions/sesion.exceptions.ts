import { DomainException } from './domain.exception';

export class SesionConversacionalNoEncontradaException extends DomainException {
  readonly tipo = 'NO_ENCONTRADO';

  constructor() {
    super('No se encontró la sesión de chat.', 'SESION_NO_ENCONTRADA');
  }
}

export class SesionErrorConfiguracionException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super(
      'La sesión de chat tiene un error de configuración del árbol conversacional.',
      'SESION_ERROR_CONFIGURACION',
    );
  }
}

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
