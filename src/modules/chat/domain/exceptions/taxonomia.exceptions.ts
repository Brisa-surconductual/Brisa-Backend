import { DomainException } from './domain.exception';

/** RF-30B: la definición enviada para crear una variable no es coherente. */
export class DefinicionVariableInvalidaException extends DomainException {
  readonly tipo = 'NO_PROCESABLE';

  constructor(mensaje: string, detalles?: unknown) {
    super(mensaje, 'DEFINICION_VARIABLE_INVALIDA', detalles);
  }
}

export class VariableDuplicadaException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super('Ya existe una variable con ese código.', 'VARIABLE_DUPLICADA');
  }
}

export class VariableNoEncontradaException extends DomainException {
  readonly tipo = 'NO_ENCONTRADO';

  constructor() {
    super('La variable indicada no existe.', 'VARIABLE_NO_ENCONTRADA');
  }
}

export class VariableEnUsoPublicadoException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super(
      'No se puede deshabilitar: un flujo publicado tiene nodos que capturan esta variable.',
      'VARIABLE_EN_USO_PUBLICADO',
    );
  }
}

// ── Validación de la marca `contenido.variable` del nodo ───────────────────

export class VariableNodoInvalidaException extends DomainException {
  readonly tipo = 'NO_PROCESABLE';

  constructor(detalles?: unknown) {
    super(
      'La variable del nodo debe ser un objeto con un código válido; un nodo captura como máximo una variable.',
      'VARIABLE_NODO_INVALIDA',
      detalles,
    );
  }
}

export class VariableNoValidaException extends DomainException {
  readonly tipo = 'NO_PROCESABLE';

  constructor(detalles?: unknown) {
    super(
      'La variable indicada no existe en la taxonomía.',
      'VARIABLE_NO_VALIDA',
      detalles,
    );
  }
}

export class VariableDeshabilitadaException extends DomainException {
  readonly tipo = 'NO_PROCESABLE';

  constructor(detalles?: unknown) {
    super(
      'La variable indicada está deshabilitada.',
      'VARIABLE_DESHABILITADA',
      detalles,
    );
  }
}

export class NodoFinalConVariableException extends DomainException {
  readonly tipo = 'NO_PROCESABLE';

  constructor(detalles?: unknown) {
    super(
      'El nodo final no puede capturar variables: el estudiante no responde en él.',
      'NODO_FINAL_CON_VARIABLE',
      detalles,
    );
  }
}

export class TipoEntradaIncompatibleException extends DomainException {
  readonly tipo = 'NO_PROCESABLE';

  constructor(detalles: unknown) {
    super(
      'El tipo de respuesta del nodo no es compatible con la variable seleccionada.',
      'TIPO_ENTRADA_INCOMPATIBLE',
      detalles,
    );
  }
}

export class OpcionesFueraDeTaxonomiaException extends DomainException {
  readonly tipo = 'NO_PROCESABLE';

  constructor(detalles: unknown) {
    super(
      'Las opciones del nodo deben pertenecer a los valores de la variable.',
      'OPCIONES_FUERA_DE_TAXONOMIA',
      detalles,
    );
  }
}
