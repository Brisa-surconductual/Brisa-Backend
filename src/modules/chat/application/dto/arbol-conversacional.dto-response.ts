import {
  ArbolConversacional,
  FlujoConversacional,
  NodoConversacional,
  ResultadoValidacionArbol,
  TipoNodoConversacional,
  TransicionConversacional,
} from '../../domain/entities/arbol-conversacional.entity';
import {
  EstadoFlujoConversacional,
  ModalidadConversacional,
  OperadorCondicion,
  TipoDatoValidacion,
} from '../../domain/enums/arbol-conversacional.enums';

export class FlujoConversacionalDtoResponse {
  id_flujo!: string;
  nombre!: string;
  modalidad!: ModalidadConversacional;
  estado!: EstadoFlujoConversacional;
  version!: number;
  creado_por!: string;
  fecha_creacion!: Date;
  fecha_publicacion!: Date | null;

  static crear(flujo: FlujoConversacional): FlujoConversacionalDtoResponse {
    return {
      id_flujo: flujo.idFlujo,
      nombre: flujo.nombre,
      modalidad: flujo.modalidad,
      estado: flujo.estado,
      version: flujo.version,
      creado_por: flujo.creadoPor,
      fecha_creacion: flujo.fechaCreacion,
      fecha_publicacion: flujo.fechaPublicacion,
    };
  }
}

export class TipoNodoDtoResponse {
  id_tipo_nodo!: string;
  nombre!: string;

  static crear(tipo: TipoNodoConversacional): TipoNodoDtoResponse {
    return { id_tipo_nodo: tipo.idTipoNodo, nombre: tipo.nombre };
  }
}

export class NodoConversacionalDtoResponse {
  id_nodo!: string;
  id_flujo!: string;
  id_tipo_nodo!: string;
  tipo_nodo!: string;
  contenido!: Record<string, unknown>;
  es_nodo_inicial!: boolean;
  orden!: number | null;
  id_contenido_cronograma!: string | null;
  creado_por!: string;
  fecha_creacion!: Date;
  fecha_actualizacion!: Date;

  static crear(nodo: NodoConversacional): NodoConversacionalDtoResponse {
    return {
      id_nodo: nodo.idNodo,
      id_flujo: nodo.idFlujo,
      id_tipo_nodo: nodo.idTipoNodo,
      tipo_nodo: nodo.nombreTipoNodo,
      contenido: nodo.contenido,
      es_nodo_inicial: nodo.esNodoInicial,
      orden: nodo.orden,
      id_contenido_cronograma: nodo.idContenidoCronograma,
      creado_por: nodo.creadoPor,
      fecha_creacion: nodo.fechaCreacion,
      fecha_actualizacion: nodo.fechaActualizacion,
    };
  }
}

export class TransicionConversacionalDtoResponse {
  id_transicion!: string;
  id_flujo!: string;
  id_nodo_origen!: string;
  id_nodo_destino!: string;
  operador_condicion!: OperadorCondicion;
  valor_condicion!: unknown;
  orden_evaluacion!: number;
  regla_validacion!: {
    id_regla_validacion: string;
    tipo_dato: TipoDatoValidacion;
    obligatorio: boolean;
    valor_min: number | null;
    valor_max: number | null;
    formato_regex: string | null;
    valores_permitidos: string[];
    mensaje_error: string;
  };
  fecha_creacion!: Date;

  static crear(
    transicion: TransicionConversacional,
  ): TransicionConversacionalDtoResponse {
    return {
      id_transicion: transicion.idTransicion,
      id_flujo: transicion.idFlujo,
      id_nodo_origen: transicion.idNodoOrigen,
      id_nodo_destino: transicion.idNodoDestino,
      operador_condicion: transicion.operadorCondicion,
      valor_condicion: transicion.valorCondicion,
      orden_evaluacion: transicion.ordenEvaluacion,
      regla_validacion: {
        id_regla_validacion: transicion.reglaValidacion.idReglaValidacion,
        tipo_dato: transicion.reglaValidacion.tipoDato,
        obligatorio: transicion.reglaValidacion.obligatorio,
        valor_min: transicion.reglaValidacion.valorMin,
        valor_max: transicion.reglaValidacion.valorMax,
        formato_regex: transicion.reglaValidacion.formatoRegex,
        valores_permitidos: transicion.reglaValidacion.valoresPermitidos,
        mensaje_error: transicion.reglaValidacion.mensajeError,
      },
      fecha_creacion: transicion.fechaCreacion,
    };
  }
}

export class ArbolConversacionalDtoResponse {
  flujo!: FlujoConversacionalDtoResponse;
  nodos!: NodoConversacionalDtoResponse[];
  transiciones!: TransicionConversacionalDtoResponse[];

  static crear(arbol: ArbolConversacional): ArbolConversacionalDtoResponse {
    return {
      flujo: FlujoConversacionalDtoResponse.crear(arbol.flujo),
      nodos: arbol.nodos.map((nodo) =>
        NodoConversacionalDtoResponse.crear(nodo),
      ),
      transiciones: arbol.transiciones.map((transicion) =>
        TransicionConversacionalDtoResponse.crear(transicion),
      ),
    };
  }
}

export class ValidacionArbolDtoResponse {
  valido!: true;
  total_nodos!: number;
  total_transiciones!: number;

  static crear(
    resultado: ResultadoValidacionArbol,
  ): ValidacionArbolDtoResponse {
    return {
      valido: true,
      total_nodos: resultado.totalNodos,
      total_transiciones: resultado.totalTransiciones,
    };
  }
}
