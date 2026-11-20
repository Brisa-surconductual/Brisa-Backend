import { ArbolConversacional } from '../../domain/entities/flujo/arbol-conversacional.entity';
import { ResultadoValidacionArbol } from '../../domain/results/resultado-validacion-arbol';
import { FlujoConversacional } from '../../domain/entities/flujo/flujo-conversacional.entity';
import { NodoConversacional } from '../../domain/entities/flujo/nodo-conversacional.entity';
import { TipoNodoConversacional } from '../../domain/entities/catalogos/tipo-nodo.entity';
import { TransicionConversacional } from '../../domain/entities/flujo/transicion-conversacional.entity';
import { ReglaValidacion } from '../../domain/entities/reglas-validacion/reglas-validacion.entity';
import { EstadoFlujoConversacional } from '../../domain/enums/estado-flujo-conversacional.enum';
import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';
import { OperadorCondicion } from '../../domain/enums/operador-condicional.enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/perfil-clinico.enum';
import { TipoDatoValidacion } from '../../domain/enums/tipo-dato-validacion-enum';

export class FlujoConversacionalDtoResponse {
  id_flujo!: string;
  nombre!: string;
  modalidad!: ModalidadConversacional;
  estado!: EstadoFlujoConversacional;
  version!: number;
  creado_por!: string;
  fecha_creacion!: Date;
  fecha_publicacion!: Date | null;
  tipo_dependencia!: TipoDependenciaClinica | null;
  tipo_craving!: TipoCravingClinico | null;
  fecha_archivado!: Date | null;

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
      tipo_dependencia: flujo.tipoDependencia,
      tipo_craving: flujo.tipoCraving,
      fecha_archivado: flujo.fechaArchivado,
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

export class ReglaTransicionDtoResponse {
  id_regla_validacion!: string;
  operador_condicion!: OperadorCondicion;
  valor_esperado!: unknown;
  tipo_dato!: TipoDatoValidacion;
  obligatorio!: boolean;
  valor_min!: number | null;
  valor_max!: number | null;
  formato_regex!: string | null;
  valores_permitidos!: string[];
  mensaje_error!: string;

  static crear(regla: ReglaValidacion): ReglaTransicionDtoResponse {
    return {
      id_regla_validacion: regla.idReglaValidacion,
      operador_condicion: regla.operadorCondicion,
      valor_esperado: regla.valorEsperado,
      tipo_dato: regla.tipoDato,
      obligatorio: regla.obligatorio,
      valor_min: regla.valorMin,
      valor_max: regla.valorMax,
      formato_regex: regla.formatoRegex,
      valores_permitidos: regla.valoresPermitidos,
      mensaje_error: regla.mensajeError,
    };
  }
}

export class TransicionConversacionalDtoResponse {
  id_transicion!: string;
  id_flujo!: string;
  id_nodo_origen!: string;
  id_nodo_destino!: string;
  orden_evaluacion!: number;
  /** `null` cuando el nodo origen no espera respuesta (transición automática). */
  regla_validacion!: ReglaTransicionDtoResponse | null;
  fecha_creacion!: Date;

  static crear(
    transicion: TransicionConversacional,
  ): TransicionConversacionalDtoResponse {
    return {
      id_transicion: transicion.idTransicion,
      id_flujo: transicion.idFlujo,
      id_nodo_origen: transicion.idNodoOrigen,
      id_nodo_destino: transicion.idNodoDestino,
      orden_evaluacion: transicion.ordenEvaluacion,
      regla_validacion:
        transicion.reglaValidacion === null
          ? null
          : ReglaTransicionDtoResponse.crear(transicion.reglaValidacion),
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
