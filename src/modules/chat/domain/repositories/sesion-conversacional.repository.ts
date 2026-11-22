import { SesionConversacional } from '../entities/sesion/sesion-conversacional.entity';

export abstract class SesionConversacionalRepository {
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
