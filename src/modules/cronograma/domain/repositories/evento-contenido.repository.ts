import { ContenidoEstadoPendiente } from '../entities/contenido-estado-pendiente.entity';
import {
  EventoContenido,
  ModuloDestinoEvento,
} from '../entities/evento-contenido.entity';

export interface EntregaEventoContenidoPendiente {
  readonly evento: EventoContenido;
  readonly modulo: ModuloDestinoEvento;
}

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

  abstract buscarEntregasPendientes(
    limite: number,
  ): Promise<EntregaEventoContenidoPendiente[]>;

  abstract marcarEntregaPublicada(
    idEvento: bigint,
    idModulo: string,
    fechaPublicacion: Date,
  ): Promise<void>;

  abstract registrarFalloEntrega(
    idEvento: bigint,
    idModulo: string,
    fechaIntento: Date,
    detalle: string,
  ): Promise<void>;
}
