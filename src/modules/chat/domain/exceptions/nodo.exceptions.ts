import { DomainException } from './domain.exception';

export class NodoActualNoEncontradoException extends DomainException {
  readonly tipo = 'NO_ENCONTRADO';

  constructor() {
    super('No se pudo recuperar el contenido del chat.', 'NODO_INEXISTENTE');
  }
}

export class NodoFueraDeFlujoException extends DomainException {
  readonly tipo = 'NO_PROCESABLE';

  constructor() {
    super(
      'Los nodos de la transición deben pertenecer al flujo indicado.',
      'NODO_FUERA_DE_FLUJO',
    );
  }
}

export class NodoConversacionalNoEncontradoException extends DomainException {
  readonly tipo = 'NO_ENCONTRADO';

  constructor() {
    super('El nodo conversacional no existe en el flujo indicado.');
  }
}

export class NodoConversacionalDuplicadoException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super('El nodo conversacional ya se encuentra registrado.');
  }
}

export class NodoInicialDuplicadoException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super('El flujo conversacional ya tiene un nodo inicial.');
  }
}

export class TipoNodoNoEncontradoException extends DomainException {
  readonly tipo = 'NO_ENCONTRADO';

  constructor() {
    super('El tipo de nodo indicado no existe.');
  }
}

export class ContenidoCronogramaNoEncontradoException extends DomainException {
  readonly tipo = 'NO_ENCONTRADO';

  constructor() {
    super('El contenido de cronograma asociado no existe.');
  }
}

export class OrdenNodoInicialInvalidoException extends DomainException {
  readonly tipo = 'SOLICITUD_INVALIDA';

  constructor() {
    super(
      'El nodo inicial del flujo debe tener orden 1.',
      'ORDEN_NODO_INICIAL_INVALIDO',
    );
  }
}

export class OrdenNodoDuplicadoException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor(orden: number) {
    super(
      `El orden ${orden} ya está asignado a otro nodo de este flujo.`,
      'ORDEN_NODO_DUPLICADO',
      { orden },
    );
  }
}

export class OrdenNodoConSaltoException extends DomainException {
  readonly tipo = 'SOLICITUD_INVALIDA';

  constructor(ordenEsperado: number, ordenRecibido: number) {
    super(
      `El siguiente orden disponible es ${ordenEsperado}; no se pueden omitir números (se recibió ${ordenRecibido}).`,
      'ORDEN_NODO_CON_SALTO',
      { orden_esperado: ordenEsperado, orden_recibido: ordenRecibido },
    );
  }
}
