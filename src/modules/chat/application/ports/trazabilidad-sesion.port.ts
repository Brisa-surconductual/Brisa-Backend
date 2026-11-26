import { TrazabilidadSesionDtoResponse } from '../dto/trazabilidad-sesion.dto-response';

/**
 * Puerto que Chat expone a M-8 (Administrativo): secuencia completa de nodos,
 * respuestas y transiciones de una sesión, de solo lectura.
 */
export abstract class TrazabilidadPort {
  abstract obtenerSesion(
    idSesion: string,
  ): Promise<TrazabilidadSesionDtoResponse>;
}
