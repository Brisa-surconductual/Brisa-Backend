import { Injectable } from '@nestjs/common';
import { TransicionEstadoContenido } from '../../domain/entities/contenido-estado-pendiente.entity';
import { EventoContenido } from '../../domain/entities/evento-contenido.entity';
import { CambioEstadoContenidoInvalidoException } from '../../domain/exeption/cambio-estado-contenido-invalido.exception';
import { EventoContenidoDuplicadoException } from '../../domain/exeption/evento-contenido-duplicado.exception';
import { PublicacionEventoContenidoException } from '../../domain/exeption/publicacion-evento-contenido.exception';
import { EventoContenidoRepository } from '../../domain/repositories/evento-contenido.repository';
import { EventoContenidoPublisher } from '../ports/evento-contenido.publisher';

export interface ResultadoPublicacionEventosContenido {
  readonly contenidos_revisados: number;
  readonly eventos_publicados: number;
  readonly eventos_duplicados: number;
  readonly cambios_invalidos: number;
}

@Injectable()
export class PublicarEventosCambioEstadoUseCase {
  private readonly limitePorEjecucion = 100;

  constructor(
    private readonly eventoRepository: EventoContenidoRepository,
    private readonly publisher: EventoContenidoPublisher,
  ) {}

  async execute(
    ahora: Date = new Date(),
  ): Promise<ResultadoPublicacionEventosContenido> {
    const pendientes = await this.eventoRepository.buscarCambiosPendientes(
      this.limitePorEjecucion,
    );
    const modulosPorContenido =
      await this.eventoRepository.buscarModulosDestinoPorContenido(
        pendientes.map((contenido) => contenido.id_contenido),
      );

    let publicados = 0;
    let duplicados = 0;
    let invalidos = 0;

    for (const contenido of pendientes) {
      let transiciones: readonly TransicionEstadoContenido[];

      try {
        transiciones = contenido.obtenerTransicionesPendientes();
      } catch (error: unknown) {
        if (error instanceof CambioEstadoContenidoInvalidoException) {
          invalidos += 1;
          continue;
        }

        throw error;
      }

      const modulosDestino =
        modulosPorContenido.get(contenido.id_contenido) ?? [];

      for (const transicion of transiciones) {
        const evento = EventoContenido.crear(
          contenido,
          transicion,
          modulosDestino,
          ahora,
        );
        let registrado: EventoContenido;

        try {
          registrado = await this.registrarEvento(evento);
        } catch (error: unknown) {
          if (error instanceof EventoContenidoDuplicadoException) {
            duplicados += 1;
            continue;
          }

          throw error;
        }

        try {
          await this.publisher.publicar(registrado);
        } catch {
          throw new PublicacionEventoContenidoException();
        }

        publicados += 1;
      }
    }

    return {
      contenidos_revisados: pendientes.length,
      eventos_publicados: publicados,
      eventos_duplicados: duplicados,
      cambios_invalidos: invalidos,
    };
  }

  private async registrarEvento(
    evento: EventoContenido,
  ): Promise<EventoContenido> {
    const registrado = await this.eventoRepository.registrarSiNoExiste(evento);

    if (!registrado) {
      throw new EventoContenidoDuplicadoException();
    }

    return registrado;
  }
}
