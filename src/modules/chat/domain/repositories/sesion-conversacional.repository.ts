import { SesionConversacional } from '../entities/sesion/sesion-conversacional.entity';

export abstract class SesionConversacionalRepository {
  /** Lectura de una sesión concreta, limitada a su propietario. No reanuda. */
  abstract buscarPorIdYUsuario(
    idSesion: string,
    idUsuario: string,
  ): Promise<SesionConversacional | null>;

  abstract buscarUltimaNoCompletada(
    idUsuario: string,
  ): Promise<SesionConversacional | null>;

  /**
   * Una sesión previa sin completar impide crear otra. Si dos intentos
   * registran un fallo de configuración, ambos conservan la misma sesión de error.
   */
  abstract guardar(sesion: SesionConversacional): Promise<void>;
}
