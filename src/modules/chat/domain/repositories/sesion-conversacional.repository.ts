import {
  EstadoSesionConversacional,
  SesionConversacional,
} from '../entities/sesion/sesion-conversacional.entity';
import { ModalidadConversacional } from '../enums/modalidad-conversacional-enum';

/** RF-38 (M-8): resumen de una sesión para el listado administrativo. */
export interface ResumenSesionConversacional {
  idSesion: string;
  /** Dueño de la sesión: solo para comprobar el aislamiento, nunca se expone. */
  idUsuario: string;
  modalidad: ModalidadConversacional;
  estado: EstadoSesionConversacional;
  fechaInicio: Date;
  fechaUltimaInteraccion: Date;
  /**
   * `fecha_ultima_interaccion` con la precisión de la BD (microsegundos,
   * ISO 8601 UTC): la usa el cursor para no perder ni repetir sesiones que
   * comparten el mismo milisegundo.
   */
  marcaOrden: string;
}

/** Posición tras la cual continúa el listado (orden descendente). */
export interface CursorSesionesParticipante {
  fechaUltimaInteraccion: string;
  idSesion: string;
}

export interface PaginaSesionesParticipante {
  sesiones: ResumenSesionConversacional[];
  /** Total de sesiones del participante, sin paginar. */
  total: number;
  hayMas: boolean;
}

export abstract class SesionConversacionalRepository {
  /**
   * RF-38 (M-8): sesiones de un usuario, de la última interacción más reciente
   * a la más antigua; a igualdad de fecha, por `id_sesion` descendente. Solo
   * lectura.
   */
  abstract listarPorUsuario(
    idUsuario: string,
    limite: number,
    despuesDe: CursorSesionesParticipante | null,
  ): Promise<PaginaSesionesParticipante>;

  /** Lectura administrativa (auditoría): cualquier sesión, sin filtrar dueño. */
  abstract buscarPorId(idSesion: string): Promise<SesionConversacional | null>;

  /** Lectura de una sesión concreta, limitada a su propietario. No reanuda. */
  abstract buscarPorIdYUsuario(
    idSesion: string,
    idUsuario: string,
  ): Promise<SesionConversacional | null>;

  /**
   * Última sesión pendiente (ACTIVA, PAUSADA o ERROR_CONFIGURACION) del usuario.
   * Ignora las sesiones pendientes de un árbol que el usuario ya completó:
   * son duplicados y nunca prevalecen sobre la sesión COMPLETADA.
   */
  abstract buscarUltimaNoCompletada(
    idUsuario: string,
  ): Promise<SesionConversacional | null>;

  /** Sesión COMPLETADA del usuario para un árbol (flujo y versión). No reanuda. */
  abstract buscarCompletadaDelArbol(
    idUsuario: string,
    idFlujo: string,
    version: number,
  ): Promise<SesionConversacional | null>;

  /**
   * Una sesión previa sin completar impide crear otra, y tampoco se crea una
   * sesión de un árbol que el usuario ya completó (ArbolYaCompletadoException).
   * Si dos intentos registran un fallo de configuración, ambos conservan la
   * misma sesión de error.
   */
  abstract guardar(sesion: SesionConversacional): Promise<void>;
}
