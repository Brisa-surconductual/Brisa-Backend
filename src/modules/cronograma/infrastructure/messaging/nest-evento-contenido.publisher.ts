import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  construirTopicoModuloEventoContenido,
  EventoContenidoPublisher,
} from '../../application/ports/evento-contenido.publisher';
import { AutorizarConsumoEventoContenidoService } from '../../application/service/autorizar-consumo-evento-contenido.service';
import {
  EventoContenido,
  ModuloDestinoEvento,
} from '../../domain/entities/evento-contenido.entity';
import { PublicacionEventoContenidoException } from '../../domain/exeption/publicacion-evento-contenido.exception';

@Injectable()
export class NestEventoContenidoPublisher implements EventoContenidoPublisher {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly autorizacion: AutorizarConsumoEventoContenidoService,
  ) {}

  async publicar(
    evento: EventoContenido,
    modulo: ModuloDestinoEvento,
  ): Promise<void> {
    this.autorizacion.validar(modulo.codigo_modulo, evento);
    const topico = construirTopicoModuloEventoContenido(modulo.codigo_modulo);

    if (!this.eventEmitter.hasListeners(topico)) {
      throw new PublicacionEventoContenidoException();
    }

    await this.eventEmitter.emitAsync(topico, evento);
  }
}
