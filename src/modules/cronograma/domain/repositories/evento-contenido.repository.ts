import { ContenidoEstadoPendiente } from '../entities/contenido-estado-pendiente.entity';
import {
  EventoContenido,
  ModuloDestinoEvento,
} from '../entities/evento-contenido.entity';

export abstract class EventoContenidoRepository {
  abstract buscarCambiosPendientes(
    limite: number,
  ): Promise<ContenidoEstadoPendiente[]>;

  abstract buscarModulosDestinoPorContenido(
    idsContenido: string[],
  ): Promise<Map<string, ModuloDestinoEvento[]>>;

  abstract registrarSiNoExiste(
    evento: EventoContenido,
  ): Promise<EventoContenido | null>;
}
