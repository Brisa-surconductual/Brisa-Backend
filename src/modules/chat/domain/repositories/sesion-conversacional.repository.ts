import { SesionConversacional } from '../entities/sesion/sesion-conversacional.entity';

export abstract class SesionConversacionalRepository {
  /** Lectura de una sesión concreta, limitada a su propietario. No reanuda. */
  abstract buscarPorIdYUsuario(
    idSesion: string,
    idUsuario: string,
  ): Promise<SesionConversacional | null>;

  abstract buscarUltimaReanudable(
    idUsuario: string,
  ): Promise<SesionConversacional | null>;

  /**
   * Persiste la sesion. Si la sesion es nueva y el usuario ya tiene una
   * sesion activa o pausada, lanza SesionActivaExistenteException.
   *
   * Una sesión en ERROR_CONFIGURACION no cuenta como activa: si el usuario ya
   * tiene una, se actualiza esa misma en lugar de crear otra.
   */
  abstract guardar(sesion: SesionConversacional): Promise<void>;
}
