import { NodoConversacional } from '../../domain/entities/flujo/nodo-conversacional.entity';
import { TransicionConversacional } from '../../domain/entities/flujo/transicion-conversacional.entity';
import { SesionConversacional } from '../../domain/entities/sesion/sesion-conversacional.entity';
import { DecisionRespuesta } from '../../domain/policies/motor-respuesta-conversacional.policy';
import { PerfilClinicoRepository } from '../../domain/repositories/perfil-clinico.repository';
import { VariableTaxonomia } from '../../domain/entities/taxonomia/variable-taxonomia.entity';
import {
  SnapshotPerfilEtiquetado,
  VariableEtiquetada,
} from '../../domain/repositories/variables-etiquetadas.repository';
import { ResultadoRespuesta } from '../dto/procesar-respuesta.dto-response';
import { EstadoConectividadRespuesta } from '../dto/procesar-respuesta.dto-request';
import { EstadoConversacionalTransaccion } from './estado-conversacional.port';

export interface SolicitudRespuesta {
  idSesion: string;
  idUsuario: string;
  idNodo: string;
  idInteraccion: string;
  secuencia: number;
  timestampInteraccion: string;
  conectividad: EstadoConectividadRespuesta;
  recursosNoPresentados: string[] | null;
}
export interface RegistroDeRespuesta {
  solicitud: SolicitudRespuesta;
  decision: DecisionRespuesta;
  resultado: ResultadoRespuesta;
  huella: string;
  ahora: Date;
}
export interface ContextoRespuestaTransaccion {
  bloquearSesion(
    idSesion: string,
    idUsuario: string,
  ): Promise<SesionConversacional | null>;
  buscarNodo(idNodo: string): Promise<NodoConversacional | null>;
  buscarTransiciones(idNodo: string): Promise<TransicionConversacional[]>;
  /** RF-25: terminal = nodo final del flujo (legado: sin transiciones de salida). */
  esTerminal(idNodo: string, idFlujo: string): Promise<boolean>;
  /** RF-25: destino del avance implícito de un nodo sin respuesta, si aplica. */
  siguienteNodoImplicito(idNodo: string): Promise<string | null>;
  /**
   * RF-43: estado de la intervención de una sesión SOS, con `vencida`
   * calculada por el reloj de PostgreSQL. null si la sesión no es SOS.
   */
  estadoIntervencionSos(
    idSesion: string,
  ): Promise<{ enCurso: boolean; vencida: boolean } | null>;
}
export interface RegistroRespuestaTransaccion {
  buscarResultado(idInteraccion: string): Promise<{
    idSesion: string;
    resultado: unknown;
    huella: string | null;
  } | null>;
  ultimaSecuencia(idSesion: string): Promise<number>;
  guardar(registro: RegistroDeRespuesta): Promise<void>;
}
/** RF-30B: taxonomía y etiquetado dentro de la transacción del POST. */
export interface VariablesRespuestaTransaccion {
  buscarVariable(codigo: string): Promise<VariableTaxonomia | null>;
  versionActual(): Promise<string>;
  snapshotPerfil(idUsuario: string): Promise<SnapshotPerfilEtiquetado>;
  registrar(etiqueta: VariableEtiquetada): Promise<void>;
}
export interface TransaccionRespuesta {
  contexto: ContextoRespuestaTransaccion;
  registro: RegistroRespuestaTransaccion;
  perfil: PerfilClinicoRepository;
  estado: EstadoConversacionalTransaccion;
  variables: VariablesRespuestaTransaccion;
}

/** Aplicación coordina el negocio; el adaptador asegura una única transacción. */
export abstract class ProcesarRespuestaPort {
  abstract ejecutar<T>(
    operacion: (tx: TransaccionRespuesta) => Promise<T>,
  ): Promise<T>;
}
export abstract class ComprobarFormatoRespuestaPort {
  abstract coincide(patron: string, texto: string): boolean;
}
export type { ResultadoRespuesta } from '../dto/procesar-respuesta.dto-response';
