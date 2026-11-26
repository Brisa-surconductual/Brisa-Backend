import {
  CicloConversacionalNoPermitidoException,
  FlujoConversacionalNoEditableException,
  NodoInicialInexistenteException,
  NodosHuerfanosException,
  TransicionPorDefectoDuplicadaException,
} from '../../exceptions';
import { OperadorCondicion } from '../../enums/operador-condicional.enum';
import { DimensionPerfilClinico } from '../../enums/perfil-clinico.enum';
import { TipoEntradaRespuesta } from '../../enums/tipo-entrada-respuesta.enum';
import {
  extraerCapturaPerfil,
  VALORES_DIMENSION_PERFIL,
} from '../../policies/dimension-captura-perfil';
import { valoresPermitidosCoincidenConDominio } from '../../policies/valores-permitidos-captura-perfil';
import {
  flujoUsaNodoFinal,
  siguienteNodoPorOrden,
} from '../../policies/nodo-final.policy';
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
import { DiagnosticoRestriccionesSos } from '../../results/diagnostico-restricciones-sos';
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
      sin_nodo_final:
        this.nodos.filter((nodo) => nodo.esNodoFinal).length !== 1,
      // Sin nodo final no hay forma de distinguir un cierre de un callejón.
      nodos_sin_salida: flujoUsaNodoFinal(this.nodos)
        ? this.nodos
            .filter(
              (nodo) =>
                !nodo.esNodoFinal &&
                (adyacencias.get(nodo.idNodo) ?? []).length === 0,
            )
            .map((nodo) => this.describirNodo(nodo))
        : [],
    };
  }

  /**
   * RF-25 / RF-27B: el árbol grupal debe capturar cada dimensión del perfil.
   * - Captura por valor: entre todos sus nodos deben cubrir todos los valores
   *   de la dimensión (varias ramas pueden asignar el mismo valor).
   * - Captura legado (sin valor): exactamente un nodo, con opciones iguales
   *   al dominio clínico.
   * No se mezclan ambos estilos en una misma dimensión.
   */
  diagnosticarCapturaPerfil(): DiagnosticoCapturaPerfil {
    const ausentes: DimensionPerfilClinico[] = [];
    const duplicadas: DimensionPerfilClinico[] = [];
    const valoresInvalidos: DimensionPerfilClinico[] = [];
    const valoresFaltantes: {
      dimension: DimensionPerfilClinico;
      valores_faltantes: string[];
    }[] = [];

    for (const dimension of Object.values(DimensionPerfilClinico)) {
      const capturas = this.nodos
        .map((nodo) => ({
          nodo,
          captura: extraerCapturaPerfil(nodo.contenido),
        }))
        .filter(({ captura }) => captura?.dimension === dimension);
      const legado = capturas.filter(({ captura }) => captura?.valor === null);
      const conValor = capturas.filter(
        ({ captura }) => captura?.valor !== null,
      );

      if (capturas.length === 0) {
        ausentes.push(dimension);
      } else if (legado.length > 0 && conValor.length > 0) {
        duplicadas.push(dimension);
      } else if (legado.length > 0) {
        if (legado.length > 1) duplicadas.push(dimension);
        else if (!this.opcionesCoincidenConDominio(legado[0].nodo, dimension))
          valoresInvalidos.push(dimension);
      } else {
        const cubiertos = new Set(
          conValor.map(({ captura }) => captura?.valor),
        );
        const faltan = VALORES_DIMENSION_PERFIL[dimension].filter(
          (valor) => !cubiertos.has(valor),
        );
        if (faltan.length > 0)
          valoresFaltantes.push({ dimension, valores_faltantes: faltan });
      }
    }

    return {
      dimensiones_ausentes: ausentes,
      dimensiones_duplicadas: duplicadas,
      dimensiones_valores_invalidos: valoresInvalidos,
      dimensiones_valores_faltantes: valoresFaltantes,
    };
  }

  /**
   * RF-43: el flujo SOS no captura perfil clínico ni liga nodos a contenido
   * del cronograma, para que sus nodos sean fijos y siempre estén habilitados.
   */
  diagnosticarRestriccionesSos(): DiagnosticoRestriccionesSos {
    return {
      nodos_con_captura_perfil: this.nodos
        .filter(
          (nodo) =>
            nodo.contenido.capturaPerfil != null ||
            nodo.contenido.captura_perfil != null,
        )
        .map((nodo) => nodo.idNodo),
      nodos_con_contenido_cronograma: this.nodos
        .filter((nodo) => nodo.idContenido !== null)
        .map((nodo) => nodo.idNodo),
    };
  }

  private opcionesCoincidenConDominio(
    nodo: NodoConversacional,
    dimension: DimensionPerfilClinico,
  ): boolean {
    const entrada = nodo.contenido.entrada;
    const opciones =
      typeof entrada === 'object' && entrada !== null
        ? opcionesDelNodo(entrada as Record<string, unknown>)
        : [];
    return valoresPermitidosCoincidenConDominio(dimension, opciones);
  }

  // ── Transiciones de un origen (RF-25) ───────────────────────────────────

  transicionesDeOrigen(idNodoOrigen: string): TransicionConversacional[] {
    return this.transiciones
      .filter((t) => t.idNodoOrigen === idNodoOrigen)
      .sort((a, b) => a.ordenEvaluacion - b.ordenEvaluacion);
  }

  /** La transición "cualquier otra respuesta" (operador SIEMPRE) del origen, si existe. */
  transicionPorDefecto(idNodoOrigen: string): TransicionConversacional | null {
    return (
      this.transicionesDeOrigen(idNodoOrigen).find(esTransicionPorDefecto) ??
      null
    );
  }

  /** Orden sugerido para una transición específica nueva: máximo + 1. */
  siguienteOrdenEvaluacion(idNodoOrigen: string): number {
    const especificas = this.transicionesDeOrigen(idNodoOrigen).filter(
      (t) => !esTransicionPorDefecto(t),
    );
    return especificas.length === 0
      ? 1
      : Math.max(...especificas.map((t) => t.ordenEvaluacion)) + 1;
  }

  /** A lo sumo una transición SIEMPRE por origen. */
  validarTransicionPorDefectoUnica(idNodoOrigen: string): void {
    const porDefecto = this.transicionesDeOrigen(idNodoOrigen).filter(
      esTransicionPorDefecto,
    );
    if (porDefecto.length > 1)
      throw new TransicionPorDefectoDuplicadaException();
  }

  /**
   * La transición SIEMPRE queda siempre última: devuelve su versión con el
   * orden corregido, o `null` si no existe o ya está en su sitio.
   */
  reubicarTransicionPorDefecto(
    idNodoOrigen: string,
  ): TransicionConversacional | null {
    const porDefecto = this.transicionPorDefecto(idNodoOrigen);
    if (porDefecto === null) return null;
    const orden = this.siguienteOrdenEvaluacion(idNodoOrigen);
    return porDefecto.ordenEvaluacion === orden
      ? null
      : porDefecto.actualizar({ ordenEvaluacion: orden });
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
      // La transición "cualquier otra respuesta" cubre todos los valores.
      if (
        requeridos === null ||
        salidas.length === 0 ||
        salidas.some(esTransicionPorDefecto)
      )
        continue;

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

  /**
   * RF-25: siguiente nodo por orden para un nodo sin respuesta (CONTINUAR) que
   * no tiene transiciones explícitas; `null` si no aplica.
   */
  destinoImplicito(nodo: NodoConversacional): NodoConversacional | null {
    if (resolverTipoEntrada(nodo.contenido) !== TipoEntradaRespuesta.CONTINUAR)
      return null;
    if (this.transiciones.some((t) => t.idNodoOrigen === nodo.idNodo))
      return null;
    return siguienteNodoPorOrden(this.nodos, nodo);
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

    // RF-25: avance implícito de los nodos sin respuesta y sin transiciones.
    for (const nodo of this.nodos) {
      const destino = this.destinoImplicito(nodo);
      if (destino !== null) adyacencias.get(nodo.idNodo)?.push(destino.idNodo);
    }

    return adyacencias;
  }
}

/** RF-25: la transición "cualquier otra respuesta". */
export function esTransicionPorDefecto(
  transicion: TransicionConversacional,
): boolean {
  return (
    transicion.reglaValidacion?.operadorCondicion === OperadorCondicion.SIEMPRE
  );
}
