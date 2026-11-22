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

export class OperadorCondicionIncompatibleException extends DomainException {
  readonly tipo = 'SOLICITUD_INVALIDA';

  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class TransicionAutorreferenciadaException extends DomainException {
  readonly tipo = 'NO_PROCESABLE';

  constructor() {
    super(
      'El nodo destino no puede ser el mismo nodo de origen.',
      'TRANSICION_AUTORREFERENCIADA',
    );
  }
}

export class TransicionHaciaNodoInicialException extends DomainException {
  readonly tipo = 'NO_PROCESABLE';

  constructor() {
    super(
      'El nodo inicial no puede ser destino de una transición.',
      'TRANSICION_HACIA_NODO_INICIAL',
    );
  }
}

/** RF-25: cada origen tiene a lo sumo una transición "cualquier otra respuesta". */
export class TransicionPorDefectoDuplicadaException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super(
      'Este nodo ya tiene una transición para "cualquier otra respuesta".',
      'TRANSICION_POR_DEFECTO_DUPLICADA',
    );
  }
}

/**
 * RF-25: una transición específica no puede ir al mismo destino que
 * "cualquier otra respuesta" del mismo origen: ambos caminos serían el mismo.
 */
export class DestinoIgualAlPorDefectoException extends DomainException {
  readonly tipo = 'NO_PROCESABLE';

  constructor() {
    super(
      'El destino es el mismo de "cualquier otra respuesta" para este nodo: elige otro destino para que el camino tenga sentido.',
      'DESTINO_IGUAL_A_POR_DEFECTO',
    );
  }
}
