import {
  ArbolConversacional,
  AuditoriaArbolConversacional,
  FlujoConversacional,
  NodoConversacional,
  ReglaValidacion,
  TipoEntradaConversacional,
  TipoNodoConversacional,
  TransicionConversacional,
} from '../entities/arbol-conversacional.entity';
import {
  EstadoFlujoConversacional,
  ModalidadConversacional,
  OperadorCondicion,
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../enums/arbol-conversacional.enums';

export interface PerfilClinicoArbol {
  tipoDependencia: TipoDependenciaClinica;
  tipoCraving: TipoCravingClinico;
}

export interface ConsultaFlujos {
  modalidad?: ModalidadConversacional;
  tipoDependencia?: TipoDependenciaClinica;
  tipoCraving?: TipoCravingClinico;
  estado?: EstadoFlujoConversacional;
  page: number;
  pageSize: number;
}

export interface PaginaFlujos {
  items: FlujoConversacional[];
  total: number;
}

export interface VersionClonada {
  flujo: FlujoConversacional;
  idFlujoOrigen: string;
  nodosCopiados: number;
  transicionesCopiadas: number;
}

export interface CrearFlujoPersonalizadoCommand extends PerfilClinicoArbol {
  nombre: string;
  creadoPor: string;
}

export interface CrearFlujoGrupalCommand {
  nombre: string;
  version: number;
  creadoPor: string;
}

export interface CrearNodoCommand {
  idFlujo: string;
  idTipoNodo: string;
  contenido: Record<string, unknown>;
  esNodoInicial: boolean;
  orden: number | null;
  idContenidoCronograma: string | null;
  creadoPor: string;
}

export interface ActualizarNodoCommand {
  idFlujo: string;
  idNodo: string;
  idTipoNodo?: string;
  contenido?: Record<string, unknown>;
  esNodoInicial?: boolean;
  orden?: number | null;
  idContenidoCronograma?: string | null;
  actualizadoPor: string;
}

export interface DatosReglaValidacionCommand {
  tipoDato: ReglaValidacion['tipoDato'];
  obligatorio: boolean;
  valorMin: number | null;
  valorMax: number | null;
  formatoRegex: string | null;
  valoresPermitidos: string[];
  mensajeError: string;
}

export interface CrearReglaValidacionCommand extends DatosReglaValidacionCommand {
  creadoPor: string;
}

export interface CrearTransicionCommand {
  idFlujo: string;
  idNodoOrigen: string;
  idNodoDestino: string;
  operadorCondicion: OperadorCondicion;
  valorCondicion: unknown;
  ordenEvaluacion: number;
  reglaValidacion?: DatosReglaValidacionCommand;
  idReglaValidacion?: string;
  creadoPor: string;
}

export interface ActualizarTransicionCommand {
  idFlujo: string;
  idTransicion: string;
  idNodoOrigen?: string;
  idNodoDestino?: string;
  operadorCondicion?: OperadorCondicion;
  valorCondicion?: unknown;
  ordenEvaluacion?: number;
  reglaValidacion?: Partial<DatosReglaValidacionCommand>;
  idReglaValidacion?: string;
  actualizadoPor: string;
}

export abstract class ArbolConversacionalRepository {
  abstract listarFlujos(consulta: ConsultaFlujos): Promise<PaginaFlujos>;

  abstract clonarVersion(
    idFlujo: string,
    idActor: string,
  ): Promise<VersionClonada>;

  abstract publicarAdministrativo(
    idFlujo: string,
    idActor: string,
  ): Promise<FlujoConversacional>;

  abstract archivarAdministrativo(
    idFlujo: string,
    idActor: string,
  ): Promise<FlujoConversacional>;

  abstract crearFlujoGrupal(
    command: CrearFlujoGrupalCommand,
  ): Promise<FlujoConversacional>;

  abstract crearFlujoPersonalizado(
    command: CrearFlujoPersonalizadoCommand,
  ): Promise<FlujoConversacional>;

  abstract clonarVersionPersonalizada(
    idFlujo: string,
    idActor: string,
  ): Promise<FlujoConversacional>;

  abstract listarFlujosPersonalizados(): Promise<FlujoConversacional[]>;

  abstract buscarPublicadoGrupal(): Promise<FlujoConversacional | null>;

  abstract buscarPublicadoPersonalizado(
    perfil: PerfilClinicoArbol,
  ): Promise<FlujoConversacional | null>;

  abstract listarAuditoriaArbol(
    idFlujo: string,
  ): Promise<AuditoriaArbolConversacional[]>;

  abstract publicarPersonalizado(
    idFlujo: string,
    idActor: string,
  ): Promise<FlujoConversacional>;

  abstract archivarPersonalizado(
    idFlujo: string,
    idActor: string,
  ): Promise<FlujoConversacional>;

  abstract obtenerArbol(idFlujo: string): Promise<ArbolConversacional | null>;

  abstract listarTiposNodo(): Promise<TipoNodoConversacional[]>;

  abstract listarTiposEntrada(): Promise<TipoEntradaConversacional[]>;

  abstract listarReglasValidacion(): Promise<ReglaValidacion[]>;

  abstract buscarNodo(idNodo: string): Promise<NodoConversacional | null>;

  abstract buscarTransicion(
    idTransicion: string,
  ): Promise<TransicionConversacional | null>;

  abstract crearReglaValidacion(
    command: CrearReglaValidacionCommand,
  ): Promise<ReglaValidacion>;

  abstract crearNodo(command: CrearNodoCommand): Promise<NodoConversacional>;

  abstract actualizarNodo(
    command: ActualizarNodoCommand,
  ): Promise<NodoConversacional>;

  abstract crearTransicion(
    command: CrearTransicionCommand,
  ): Promise<TransicionConversacional>;

  abstract actualizarTransicion(
    command: ActualizarTransicionCommand,
  ): Promise<TransicionConversacional>;

  abstract publicar(
    idFlujo: string,
    idActor: string,
  ): Promise<FlujoConversacional>;
}
