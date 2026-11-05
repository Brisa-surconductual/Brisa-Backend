import {
  CicloConversacionalNoPermitidoException,
  FlujoConversacionalNoEditableException,
  NodoInicialInexistenteException,
  NodosHuerfanosException,
} from '../../exceptions';
import { DiagnosticoArbol } from './diagnostico-arbol';
import { FlujoConversacional } from './flujo-conversacional.entity';
import { NodoConversacional } from './nodo-conversacional.entity';
import { TransicionConversacional } from './transicion-conversacional.entity';

export interface ResultadoValidacionArbol {
  valido: true;
  totalNodos: number;
  totalTransiciones: number;
}

export class ArbolConversacional {
  constructor(
    readonly flujo: FlujoConversacional,
    readonly nodos: NodoConversacional[],
    readonly transiciones: TransicionConversacional[],
  ) {}

  /** Árbol resultante de agregar la transición, o de reemplazar la que tenga su mismo id. */
  conTransicion(transicion: TransicionConversacional): ArbolConversacional {
    const existe = this.transiciones.some(
      (actual) => actual.idTransicion === transicion.idTransicion,
    );
    return new ArbolConversacional(
      this.flujo,
      this.nodos,
      existe
        ? this.transiciones.map((actual) =>
            actual.idTransicion === transicion.idTransicion
              ? transicion
              : actual,
          )
        : [...this.transiciones, transicion],
    );
  }

  /**
   * Copia el árbol como una nueva versión en borrador. Cada transición recibe
   * su propia copia de la regla de validación: las versiones son independientes.
   */
  clonar(version: number, idActor: string): ArbolConversacional {
    const flujo = this.flujo.clonarComoBorrador(version, idActor);
    const nodos = this.nodos.map((nodo) =>
      nodo.copiarEn(flujo.idFlujo, idActor),
    );
    const idsNuevos = new Map(
      this.nodos.map((nodo, indice) => [nodo.idNodo, nodos[indice].idNodo]),
    );
    const transiciones = this.transiciones.map((transicion) => {
      const origen = idsNuevos.get(transicion.idNodoOrigen);
      const destino = idsNuevos.get(transicion.idNodoDestino);
      if (origen === undefined || destino === undefined) {
        throw new FlujoConversacionalNoEditableException();
      }
      return transicion.copiarEn(
        flujo.idFlujo,
        origen,
        destino,
        transicion.reglaValidacion.copiar(),
      );
    });
    return new ArbolConversacional(flujo, nodos, transiciones);
  }

  validarEstructura(): ResultadoValidacionArbol {
    const diagnostico = this.diagnosticarEstructura();
    if (diagnostico.sin_nodo_inicial) {
      throw new NodoInicialInexistenteException();
    }
    if (diagnostico.ciclos.length > 0) {
      throw new CicloConversacionalNoPermitidoException();
    }
    if (diagnostico.nodos_huerfanos.length > 0) {
      throw new NodosHuerfanosException(diagnostico.nodos_huerfanos.length);
    }
    return {
      valido: true,
      totalNodos: this.nodos.length,
      totalTransiciones: this.transiciones.length,
    };
  }

  diagnosticarEstructura(): DiagnosticoArbol {
    const nodosIniciales = this.nodos.filter((nodo) => nodo.esNodoInicial);
    const adyacencias = this.construirAdyacencias();
    const alcanzables = new Set<string>();
    const pendientes =
      nodosIniciales.length === 1 ? [nodosIniciales[0].idNodo] : [];

    while (pendientes.length > 0) {
      const actual = pendientes.shift();
      if (actual === undefined || alcanzables.has(actual)) continue;

      alcanzables.add(actual);
      for (const destino of adyacencias.get(actual) ?? []) {
        if (!alcanzables.has(destino)) pendientes.push(destino);
      }
    }

    return {
      nodos_huerfanos: this.nodos
        .filter((nodo) => !alcanzables.has(nodo.idNodo))
        .map((nodo) => nodo.idNodo),
      ciclos: this.detectarCiclos(),
      sin_nodo_inicial: nodosIniciales.length !== 1,
    };
  }

  validarAusenciaCiclos(): void {
    if (this.detectarCiclos().length > 0) {
      throw new CicloConversacionalNoPermitidoException();
    }
  }

  private detectarCiclos(): string[][] {
    const adyacencias = this.construirAdyacencias();
    const estado = new Map<string, 'VISITANDO' | 'VISITADO'>();
    const camino: string[] = [];
    const ciclos: string[][] = [];

    const visitar = (idNodo: string): void => {
      const estadoActual = estado.get(idNodo);
      if (estadoActual === 'VISITANDO') {
        ciclos.push([...camino.slice(camino.indexOf(idNodo)), idNodo]);
        return;
      }
      if (estadoActual === 'VISITADO') return;

      estado.set(idNodo, 'VISITANDO');
      camino.push(idNodo);
      for (const destino of adyacencias.get(idNodo) ?? []) visitar(destino);
      camino.pop();
      estado.set(idNodo, 'VISITADO');
    };

    for (const nodo of this.nodos) visitar(nodo.idNodo);
    return ciclos;
  }

  private construirAdyacencias(): Map<string, string[]> {
    const idsNodos = new Set(this.nodos.map((nodo) => nodo.idNodo));
    const adyacencias = new Map<string, string[]>(
      this.nodos.map((nodo) => [nodo.idNodo, []]),
    );

    for (const transicion of this.transiciones) {
      if (
        !idsNodos.has(transicion.idNodoOrigen) ||
        !idsNodos.has(transicion.idNodoDestino)
      ) {
        continue;
      }

      adyacencias.get(transicion.idNodoOrigen)?.push(transicion.idNodoDestino);
    }

    return adyacencias;
  }
}
