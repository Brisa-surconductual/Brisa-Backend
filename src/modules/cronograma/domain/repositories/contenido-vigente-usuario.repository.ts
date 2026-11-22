import { ContenidoVigenteUsuario } from '../entities/contenido-vigente-usuario.entity';

/**
 * RF-24 / RF-22: si un contenido del cronograma ya está habilitado para el
 * usuario. Solo bloquea por inicio; `fechaHabilitacion` es la fecha real
 * aproximada en que se habilitará (null si ya lo está).
 */
export interface HabilitacionContenidoUsuario {
  readonly habilitado: boolean;
  readonly fechaHabilitacion: Date | null;
}

export abstract class ContenidoVigenteUsuarioRepository {
  abstract consultar(
    idUsuario: string,
    fechaConsulta: Date,
  ): Promise<ContenidoVigenteUsuario[]>;

  abstract consultarHabilitacion(
    idUsuario: string,
    idContenido: string,
    fechaConsulta: Date,
  ): Promise<HabilitacionContenidoUsuario>;
}
