import { DomainException } from './domain.exception';

export class NodoDestinoNoEncontradoException extends DomainException {
  readonly tipo = 'NO_ENCONTRADO';

  constructor() {
    super('El nodo destino definido no es válido.');
  }
}

export class NodoOrigenNoEncontradoException extends DomainException {
  readonly tipo = 'NO_ENCONTRADO';

  constructor() {
    super('El nodo origen definido no es válido.');
  }
}

export class TransicionConversacionalNoEncontradaException extends DomainException {
  readonly tipo = 'NO_ENCONTRADO';

  constructor() {
    super('La transición conversacional no existe en el flujo indicado.');
  }
}

export class OrdenTransicionDuplicadoException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super(
      'El nodo origen ya tiene una transición con ese orden de evaluación.',
    );
  }
}
