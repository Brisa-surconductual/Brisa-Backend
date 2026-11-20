import {
  CicloConversacionalNoPermitidoException,
  FlujoConversacionalNoEditableException,
  NodoInicialInexistenteException,
  NodosHuerfanosException,
} from '../../exceptions';
import { OperadorCondicion } from '../../enums/operador-condicional.enum';
import { DimensionPerfilClinico } from '../../enums/perfil-clinico.enum';
import { TipoEntradaRespuesta } from '../../enums/tipo-entrada-respuesta.enum';
import { extraerDimensionCapturaPerfil } from '../../policies/dimension-captura-perfil';
import {
  opcionesDelNodo,
  resolverTipoEntrada,
} from '../../policies/regla-por-tipo-entrada';
import {
  DiagnosticoCobertura,
  NodoSinCobertura,
} from '../../results/diagnostico-cobertura';
import {
  DiagnosticoArbol,
  NodoDiagnostico,
} from '../../results/diagnostico-arbol';
import { DiagnosticoCapturaPerfil } from '../../results/diagnostico-captura-perfil';
import { ResultadoValidacionArbol } from '../../results/resultado-validacion-arbol';
import { FlujoConversacional } from './flujo-conversacional.entity';
import { NodoConversacional } from './nodo-conversacional.entity';
import { TransicionConversacional } from './transicion-conversacional.entity';

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
   * su propia copia de su regla: las versiones son independientes.
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
        transicion.reglaValidacion?.copiar() ?? null,
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
        .map((nodo) => this.describirNodo(nodo)),
      ciclos: this.detectarCiclos().map((ciclo) =>
        ciclo.map((idNodo) => this.describirNodoPorId(idNodo)),
      ),
      sin_nodo_inicial: nodosIniciales.length !== 1,
    };
  }

  /** RF-25: el árbol grupal debe designar exactamente un nodo por dimensión. */
  diagnosticarCapturaPerfil(): DiagnosticoCapturaPerfil {
    const ocurrencias = new Map<DimensionPerfilClinico, number>();

    for (const nodo of this.nodos) {
      const dimension = extraerDimensionCapturaPerfil(nodo.contenido);
      if (dimension === null) continue;
      ocurrencias.set(dimension, (ocurrencias.get(dimension) ?? 0) + 1);
    }

    const todas = Object.values(DimensionPerfilClinico);
    return {
      dimensiones_ausentes: todas.filter(
        (dimension) => (ocurrencias.get(dimension) ?? 0) === 0,
      ),
      dimensiones_duplicadas: todas.filter(
        (dimension) => (ocurrencias.get(dimension) ?? 0) > 1,
      ),
    };
  }

  /**
   * RF-25: en selección única y Sí/No cada respuesta posible debe tener su
   * transición; si no, el estudiante quedaría en un callejón sin salida.
   */
  diagnosticarCobertura(): DiagnosticoCobertura {
    const nodosSinCobertura: NodoSinCobertura[] = [];

    for (const nodo of this.nodos) {
      const tipo = resolverTipoEntrada(nodo.contenido);
      const requeridos =
        tipo === TipoEntradaRespuesta.OPCION_UNICA
          ? opcionesDelNodo(nodo.contenido.entrada as Record<string, unknown>)
          : tipo === TipoEntradaRespuesta.BOOLEANO
            ? ['true', 'false']
            : null;
      const salidas = this.transiciones.filter(
        (t) => t.idNodoOrigen === nodo.idNodo,
      );
      // Un nodo sin salidas es un final del flujo: no hay camino que cubrir.
      if (requeridos === null || salidas.length === 0) continue;

      const cubiertos = new Set(
        salidas
          .filter(
            (t) =>
              t.reglaValidacion?.operadorCondicion ===
              OperadorCondicion.IGUALDAD,
          )
          .map((t) =>
            String(
              (t.reglaValidacion?.valorEsperado as { valor: unknown }).valor,
            ),
          ),
      );
      const faltantes = requeridos.filter((valor) => !cubiertos.has(valor));
      if (faltantes.length > 0)
        nodosSinCobertura.push({
          ...this.describirNodo(nodo),
          valores_faltantes: faltantes,
        });
    }

    return { nodos_sin_cobertura: nodosSinCobertura };
  }

  /** Identificación legible del nodo (sin numerar ni truncar: eso es presentación). */
  private describirNodo(nodo: NodoConversacional): NodoDiagnostico {
    return {
      id_nodo: nodo.idNodo,
      orden: nodo.orden,
      texto:
        typeof nodo.contenido.texto === 'string' ? nodo.contenido.texto : '',
    };
  }

  private describirNodoPorId(idNodo: string): NodoDiagnostico {
    const nodo = this.nodos.find((actual) => actual.idNodo === idNodo);
    return nodo === undefined
      ? { id_nodo: idNodo, orden: null, texto: '' }
      : this.describirNodo(nodo);
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
