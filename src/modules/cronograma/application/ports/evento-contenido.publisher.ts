import {
  EventoContenido,
  ModuloDestinoEvento,
} from '../../domain/entities/evento-contenido.entity';

export const TOPICO_EVENTO_CONTENIDO = 'cronograma.contenido.estado-cambiado';

export function construirTopicoModuloEventoContenido(
  codigoModulo: string,
): string {
  return `${TOPICO_EVENTO_CONTENIDO}.${codigoModulo.trim().toUpperCase()}`;
}

export abstract class EventoContenidoPublisher {
  abstract publicar(
    evento: EventoContenido,
    modulo: ModuloDestinoEvento,
  ): Promise<void>;
}
