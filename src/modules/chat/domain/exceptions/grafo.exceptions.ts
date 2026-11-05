import type { DiagnosticoArbol } from '../entities/flujo/diagnostico-arbol';
import { DomainException } from './domain.exception';

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
