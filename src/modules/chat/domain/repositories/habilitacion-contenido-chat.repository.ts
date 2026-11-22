/**
 * RF-24 / RF-22: si un contenido del cronograma ya está habilitado para el
 * estudiante. `fechaHabilitacion` es la fecha real aproximada (null si ya
 * lo está o no se puede estimar).
 */
export interface HabilitacionContenidoChat {
  readonly habilitado: boolean;
  readonly fechaHabilitacion: Date | null;
}

export abstract class HabilitacionContenidoChatRepository {
  abstract consultar(
    idUsuario: string,
    idContenido: string,
  ): Promise<HabilitacionContenidoChat>;
}
