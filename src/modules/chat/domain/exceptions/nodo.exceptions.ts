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
    super('El contenido asociado no existe.');
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

/** RF-25: un nodo no puede abrir y cerrar el flujo a la vez. */
export class NodoInicialYFinalException extends DomainException {
  readonly tipo = 'NO_PROCESABLE';

  constructor() {
    super(
      'Un nodo no puede ser el nodo inicial y el nodo final del flujo a la vez.',
      'NODO_INICIAL_Y_FINAL',
    );
  }
}

/** RF-25: el nodo final cierra la terapia; no espera respuesta. */
export class NodoFinalConEntradaException extends DomainException {
  readonly tipo = 'NO_PROCESABLE';

  constructor() {
    super(
      'El nodo final no espera respuesta del estudiante.',
      'NODO_FINAL_CON_ENTRADA',
    );
  }
}

export class NodoFinalConSalidasException extends DomainException {
  readonly tipo = 'NO_PROCESABLE';

  constructor() {
    super(
      'El nodo final no puede tener transiciones de salida.',
      'NODO_FINAL_CON_SALIDAS',
    );
  }
}

export class NodoFinalConCapturaException extends DomainException {
  readonly tipo = 'NO_PROCESABLE';

  constructor() {
    super(
      'El nodo final no puede capturar perfil clínico: el estudiante no responde en él.',
      'NODO_FINAL_CON_CAPTURA',
    );
  }
}

export class NodoFinalDuplicadoException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super(
      'El flujo conversacional ya tiene un nodo final.',
      'NODO_FINAL_DUPLICADO',
    );
  }
}

/** RF-27B: la marca de captura debe nombrar una dimensión y, si lo trae, un valor de esa dimensión. */
export class CapturaPerfilInvalidaException extends DomainException {
  readonly tipo = 'NO_PROCESABLE';

  constructor(mensaje: string) {
    super(mensaje, 'CAPTURA_PERFIL_INVALIDA');
  }
}

/** RF-25: cambiar el tipo de respuesta deja sin sentido las transiciones de salida. */
export class TransicionesAfectadasException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor(detalles: {
    transiciones: {
      id_regla: string;
      id_nodo_destino: string;
      orden_evaluacion: number;
    }[];
  }) {
    super(
      'Al cambiar el tipo de respuesta, las transiciones de salida de este nodo dejan de tener sentido y deben eliminarse.',
      'TRANSICIONES_AFECTADAS',
      detalles,
    );
  }
}
