import {
  ReglaValidacion,
  TipoEntradaConversacional,
} from '../../domain/entities/arbol-conversacional.entity';
import {
  EstadoFlujoConversacional,
  ModalidadConversacional,
  OperadorCondicion,
  TipoCravingClinico,
  TipoDatoValidacion,
  TipoDependenciaClinica,
} from '../../domain/enums/arbol-conversacional.enums';
import {
  ArbolConversacionalDtoResponse,
  FlujoConversacionalDtoResponse,
  NodoConversacionalDtoResponse,
  TipoNodoDtoResponse,
  TransicionConversacionalDtoResponse,
} from './arbol-conversacional.dto-response';

export interface RespuestaChatAdmin<T> {
  data: T;
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

  static crear(
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

  static crear(
    arbol: ArbolConversacionalDtoResponse,
  ): ArbolChatAdminDtoResponse {
    return {
      flujo: arbol.flujo,
      nodos: arbol.nodos,
      transiciones: arbol.transiciones.map((transicion) =>
        TransicionChatAdminDtoResponse.crear(transicion),
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

export class CatalogosChatDtoResponse {
  tipos_nodo!: TipoNodoDtoResponse[];
  tipos_entrada!: TipoEntradaDtoResponse[];
  reglas_validacion!: ReglaValidacionDtoResponse[];
  enums!: {
    modalidad: ModalidadConversacional[];
    tipo_dependencia: TipoDependenciaClinica[];
    tipo_craving: TipoCravingClinico[];
    operador_condicion: OperadorCondicion[];
    tipo_dato: TipoDatoValidacion[];
    estado_flujo: EstadoFlujoConversacional[];
  };
}
