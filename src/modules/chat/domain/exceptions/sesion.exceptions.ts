import { DomainException } from './domain.exception';

export class SesionConversacionalNoEncontradaException extends DomainException {
  readonly tipo = 'NO_ENCONTRADO';

  constructor() {
    super(
      'No se pudo recuperar el contenido del chat.',
      'SESION_NO_ENCONTRADA',
    );
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

/** RF-31 / RF-43: solo una sesión ACTIVA puede pasar a PAUSADA. */
export class SesionNoPausableException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super(
      'La sesión conversacional no se puede pausar en su estado actual.',
      'SESION_NO_PAUSABLE',
    );
  }
}

export class EstadoSesionInconsistenteException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super(
      'El estado de la conversación es inconsistente. No fue posible recuperar la sesión.',
      'ESTADO_INCONSISTENTE',
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

/** El usuario ya completó el árbol publicado: no se crea otra sesión de él. */
export class ArbolYaCompletadoException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super(
      'El usuario ya completó el árbol conversacional publicado.',
      'ARBOL_YA_COMPLETADO',
    );
  }
}
