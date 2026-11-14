import { ReglaValidacion } from '../../domain/entities/reglas-validacion/reglas-validacion.entity';
import { ContenidoCronogramaConversacional } from '../../domain/entities/catalogos/contenido-cronograma.entity';
import { TipoEntradaConversacional } from '../../domain/entities/catalogos/tipo-entrada.entity';
import { EstadoFlujoConversacional } from '../../domain/enums/estado-flujo-conversacional.enum';
import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';
import { OperadorCondicion } from '../../domain/enums/operador-condicional.enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/perfil-clinico.enum';
import { TipoDatoValidacion } from '../../domain/enums/tipo-dato-validacion-enum';
import { TipoNodoConversacional } from '../../domain/entities/catalogos/tipo-nodo.entity';
import {
  ArbolConversacionalDtoResponse,
  FlujoConversacionalDtoResponse,
  NodoConversacionalDtoResponse,
  TipoNodoDtoResponse,
  TransicionConversacionalDtoResponse,
} from './arbol-conversacional.dto-response';

export class RespuestaChatAdminDtoResponse<T> {
  data!: T;

  static de<T>(data: T): RespuestaChatAdminDtoResponse<T> {
    return { data };
  }
}

export class TransicionChatAdminDtoResponse {
  id_regla!: string;
  id_flujo!: string;
  id_nodo_origen!: string;
  id_nodo_destino!: string;
  id_regla_validacion!: string;
  operador_condicion!: OperadorCondicion;
  valor_condicion!: unknown;
  orden_evaluacion!: number;
  fecha_creacion!: Date;

  static desde(
    transicion: TransicionConversacionalDtoResponse,
  ): TransicionChatAdminDtoResponse {
    return {
      id_regla: transicion.id_transicion,
      id_flujo: transicion.id_flujo,
      id_nodo_origen: transicion.id_nodo_origen,
      id_nodo_destino: transicion.id_nodo_destino,
      id_regla_validacion: transicion.regla_validacion.id_regla_validacion,
      operador_condicion: transicion.operador_condicion,
      valor_condicion: transicion.valor_condicion,
      orden_evaluacion: transicion.orden_evaluacion,
      fecha_creacion: transicion.fecha_creacion,
    };
  }
}

export class ArbolChatAdminDtoResponse {
  flujo!: FlujoConversacionalDtoResponse;
  nodos!: NodoConversacionalDtoResponse[];
  transiciones!: TransicionChatAdminDtoResponse[];

  static desde(
    arbol: ArbolConversacionalDtoResponse,
  ): ArbolChatAdminDtoResponse {
    return {
      flujo: arbol.flujo,
      nodos: arbol.nodos,
      transiciones: arbol.transiciones.map((transicion) =>
        TransicionChatAdminDtoResponse.desde(transicion),
      ),
    };
  }
}

export class ReglaValidacionDtoResponse {
  id_regla_validacion!: string;
  tipo_dato!: TipoDatoValidacion;
  obligatorio!: boolean;
  valor_min!: number | null;
  valor_max!: number | null;
  formato_regex!: string | null;
  valores_permitidos!: string[];
  mensaje_error!: string;

  static crear(regla: ReglaValidacion): ReglaValidacionDtoResponse {
    return {
      id_regla_validacion: regla.idReglaValidacion,
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

export class TipoEntradaDtoResponse {
  id_tipo_entrada!: string;
  nombre!: string;

  static crear(tipo: TipoEntradaConversacional): TipoEntradaDtoResponse {
    return { id_tipo_entrada: tipo.idTipoEntrada, nombre: tipo.nombre };
  }
}

export class ContenidoCronogramaDtoResponse {
  id_contenido_cronograma!: string;
  id_contenido!: string;
  nombre_contenido!: string;
  id_unidad_temporal!: string;
  nombre_unidad!: string;
  orden_unidad!: number;

  static crear(
    item: ContenidoCronogramaConversacional,
  ): ContenidoCronogramaDtoResponse {
    return {
      id_contenido_cronograma: item.idContenidoCronograma,
      id_contenido: item.idContenido,
      nombre_contenido: item.nombreContenido,
      id_unidad_temporal: item.idUnidadTemporal,
      nombre_unidad: item.nombreUnidad,
      orden_unidad: item.ordenUnidad,
    };
  }
}

export class CatalogosChatDtoResponse {
  tipos_nodo!: TipoNodoDtoResponse[];
  tipos_entrada!: TipoEntradaDtoResponse[];
  reglas_validacion!: ReglaValidacionDtoResponse[];
  contenidos_cronograma!: ContenidoCronogramaDtoResponse[];
  enums!: {
    modalidad: ModalidadConversacional[];
    tipo_dependencia: TipoDependenciaClinica[];
    tipo_craving: TipoCravingClinico[];
    operador_condicion: OperadorCondicion[];
    tipo_dato: TipoDatoValidacion[];
    estado_flujo: EstadoFlujoConversacional[];
  };

  static crear(
    tiposNodo: TipoNodoConversacional[],
    tiposEntrada: TipoEntradaConversacional[],
    reglas: ReglaValidacion[],
    contenidosCronograma: ContenidoCronogramaConversacional[],
  ): CatalogosChatDtoResponse {
    return {
      tipos_nodo: tiposNodo.map((tipo) => TipoNodoDtoResponse.crear(tipo)),
      tipos_entrada: tiposEntrada.map((tipo) =>
        TipoEntradaDtoResponse.crear(tipo),
      ),
      reglas_validacion: reglas.map((regla) =>
        ReglaValidacionDtoResponse.crear(regla),
      ),
      contenidos_cronograma: contenidosCronograma.map((item) =>
        ContenidoCronogramaDtoResponse.crear(item),
      ),
      enums: {
        modalidad: Object.values(ModalidadConversacional),
        tipo_dependencia: Object.values(TipoDependenciaClinica),
        tipo_craving: Object.values(TipoCravingClinico),
        operador_condicion: Object.values(OperadorCondicion),
        tipo_dato: Object.values(TipoDatoValidacion),
        estado_flujo: Object.values(EstadoFlujoConversacional),
      },
    };
  }
}
