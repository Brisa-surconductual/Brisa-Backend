import { HabilitacionContenidoUsuario } from '../../domain/repositories/contenido-vigente-usuario.repository';

export type { HabilitacionContenidoUsuario };

/**
 * RF-24 / RF-22: contrato servidor a servidor dentro del monolito para saber
 * si un contenido del cronograma ya está habilitado para un usuario. Lo
 * consume el chat para no dejar avanzar la terapia antes de tiempo.
 */
export abstract class ConsultaHabilitacionContenidoPort {
  abstract consultar(
    idUsuario: string,
    idContenido: string,
  ): Promise<HabilitacionContenidoUsuario>;
}
