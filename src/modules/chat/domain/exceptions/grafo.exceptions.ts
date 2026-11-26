import type { DiagnosticoArbol } from '../results/diagnostico-arbol';
import type { DiagnosticoCobertura } from '../results/diagnostico-cobertura';
import { DomainException } from './domain.exception';

/** RF-25: hay respuestas posibles (selección única, Sí/No) sin transición. */
export class CoberturaTransicionesIncompletaException extends DomainException {
  readonly tipo = 'NO_PROCESABLE';

  constructor(detalles: DiagnosticoCobertura) {
    super(
      'Hay respuestas posibles sin transición: el estudiante quedaría sin camino.',
      'COBERTURA_INCOMPLETA',
      detalles,
    );
  }
}

export class GrafoInvalidoException extends DomainException {
  readonly tipo = 'NO_PROCESABLE';

  constructor(detalles: DiagnosticoArbol) {
    super(
      'El árbol no cumple las condiciones de integridad para publicarse.',
      'GRAFO_INVALIDO',
      detalles,
    );
  }
}

export class NodoInicialInexistenteException extends DomainException {
  readonly tipo = 'SOLICITUD_INVALIDA';

  constructor() {
    super('El flujo conversacional no tiene un nodo inicial válido.');
  }
}

export class NodosHuerfanosException extends DomainException {
  readonly tipo = 'SOLICITUD_INVALIDA';

  constructor(readonly cantidad: number) {
    super('Existen nodos sin conexión dentro del flujo conversacional.');
  }
}

export class CicloConversacionalNoPermitidoException extends DomainException {
  readonly tipo = 'SOLICITUD_INVALIDA';

  constructor() {
    super('El flujo conversacional contiene un ciclo no permitido.');
  }
}
