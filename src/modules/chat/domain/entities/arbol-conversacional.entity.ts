import {
  CicloConversacionalNoPermitidoException,
  NodoInicialInexistenteException,
  NodosHuerfanosException,
  ReglaValidacionInvalidaException,
} from '../exeption/arbol-conversacional.exceptions';
import {
  EstadoFlujoConversacional,
  ModalidadConversacional,
  OperadorCondicion,
  TipoCravingClinico,
  TipoDatoValidacion,
  TipoDependenciaClinica,
} from '../enums/arbol-conversacional.enums';

export class FlujoConversacional {
  constructor(
    readonly idFlujo: string,
    readonly nombre: string,
    readonly modalidad: ModalidadConversacional,
    readonly estado: EstadoFlujoConversacional,
    readonly version: number,
    readonly creadoPor: string,
    readonly fechaCreacion: Date,
    readonly fechaPublicacion: Date | null,
    readonly tipoDependencia: TipoDependenciaClinica | null = null,
    readonly tipoCraving: TipoCravingClinico | null = null,
    readonly fechaArchivado: Date | null = null,
  ) {}
}

export class AuditoriaArbolConversacional {
  constructor(
    readonly idAuditoria: bigint,
    readonly idFlujo: string,
    readonly idActor: string,
    readonly accion: string,
    readonly idObjeto: string | null,
    readonly fechaOperacion: Date,
  ) {}
}

export class TipoNodoConversacional {
  constructor(
    readonly idTipoNodo: string,
    readonly nombre: string,
  ) {}
}

export class TipoEntradaConversacional {
  constructor(
    readonly idTipoEntrada: string,
    readonly nombre: string,
  ) {}
}

export class NodoConversacional {
  constructor(
    readonly idNodo: string,
    readonly idFlujo: string,
    readonly idTipoNodo: string,
    readonly nombreTipoNodo: string,
    readonly contenido: Record<string, unknown>,
    readonly esNodoInicial: boolean,
    readonly orden: number | null,
    readonly idContenidoCronograma: string | null,
    readonly creadoPor: string,
    readonly fechaCreacion: Date,
    readonly fechaActualizacion: Date,
  ) {}
}

export class ReglaValidacion {
  constructor(
    readonly idReglaValidacion: string,
    readonly tipoDato: TipoDatoValidacion,
    readonly obligatorio: boolean,
    readonly valorMin: number | null,
    readonly valorMax: number | null,
    readonly formatoRegex: string | null,
    readonly valoresPermitidos: string[],
    readonly mensajeError: string,
  ) {
    this.validar();
  }

  private validar(): void {
    if (
      this.valorMin !== null &&
      this.valorMax !== null &&
      this.valorMin > this.valorMax
    ) {
      throw new ReglaValidacionInvalidaException(
        'El valor mínimo no puede ser mayor que el valor máximo.',
      );
    }

    if (
      this.tipoDato !== TipoDatoValidacion.NUMERICO &&
      (this.valorMin !== null || this.valorMax !== null)
    ) {
      throw new ReglaValidacionInvalidaException(
        'Los límites mínimo y máximo solo aplican a validaciones numéricas.',
      );
    }

    if (this.formatoRegex !== null) {
      if (this.tipoDato !== TipoDatoValidacion.TEXTO) {
        throw new ReglaValidacionInvalidaException(
          'El formato regular solo aplica a validaciones de texto.',
        );
      }

      try {
        new RegExp(this.formatoRegex);
      } catch {
        throw new ReglaValidacionInvalidaException(
          'El formato regular de la validación no es válido.',
        );
      }
    }

    if (
      this.tipoDato === TipoDatoValidacion.SELECCION &&
      this.valoresPermitidos.length === 0
    ) {
      throw new ReglaValidacionInvalidaException(
        'Una validación de selección debe definir valores permitidos.',
      );
    }

    if (
      this.tipoDato !== TipoDatoValidacion.SELECCION &&
      this.valoresPermitidos.length > 0
    ) {
      throw new ReglaValidacionInvalidaException(
        'Los valores permitidos solo aplican a validaciones de selección.',
      );
    }

    if (this.mensajeError.trim().length === 0) {
      throw new ReglaValidacionInvalidaException(
        'La regla de validación debe definir un mensaje de error.',
      );
    }
  }
}

export class TransicionConversacional {
  constructor(
    readonly idTransicion: string,
    readonly idFlujo: string,
    readonly idNodoOrigen: string,
    readonly idNodoDestino: string,
    readonly operadorCondicion: OperadorCondicion,
    readonly valorCondicion: unknown,
    readonly ordenEvaluacion: number,
    readonly reglaValidacion: ReglaValidacion,
    readonly fechaCreacion: Date,
  ) {}
}

export interface ResultadoValidacionArbol {
  valido: true;
  totalNodos: number;
  totalTransiciones: number;
}

export interface DiagnosticoArbol {
  nodos_huerfanos: string[];
  ciclos: string[][];
  sin_nodo_inicial: boolean;
}

export class ArbolConversacional {
  constructor(
    readonly flujo: FlujoConversacional,
    readonly nodos: NodoConversacional[],
    readonly transiciones: TransicionConversacional[],
  ) {}

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
