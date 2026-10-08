import {
  ArbolConversacional,
  AuditoriaArbolConversacional,
  FlujoConversacional,
  NodoConversacional,
  ReglaValidacion,
  TipoNodoConversacional,
  TransicionConversacional,
} from '../entities/arbol-conversacional.entity';
import {
  OperadorCondicion,
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../enums/arbol-conversacional.enums';

export interface PerfilClinicoArbol {
  tipoDependencia: TipoDependenciaClinica;
  tipoCraving: TipoCravingClinico;
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

export interface CrearTransicionCommand {
  idFlujo: string;
  idNodoOrigen: string;
  idNodoDestino: string;
  operadorCondicion: OperadorCondicion;
  valorCondicion: unknown;
  ordenEvaluacion: number;
  reglaValidacion: DatosReglaValidacionCommand;
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
  actualizadoPor: string;
}

export abstract class ArbolConversacionalRepository {
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
