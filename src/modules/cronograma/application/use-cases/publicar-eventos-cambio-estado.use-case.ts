import { Injectable } from '@nestjs/common';
import { TransicionEstadoContenido } from '../../domain/entities/contenido-estado-pendiente.entity';
import { EventoContenido } from '../../domain/entities/evento-contenido.entity';
import { CambioEstadoContenidoInvalidoException } from '../../domain/exeption/cambio-estado-contenido-invalido.exception';
import { EventoContenidoDuplicadoException } from '../../domain/exeption/evento-contenido-duplicado.exception';
import { EventoContenidoRepository } from '../../domain/repositories/evento-contenido.repository';
import { EventoContenidoPublisher } from '../ports/evento-contenido.publisher';

export interface ResultadoPublicacionEventosContenido {
  readonly contenidos_revisados: number;
  readonly eventos_publicados: number;
  readonly eventos_duplicados: number;
  readonly cambios_invalidos: number;
  readonly contenidos_sin_modulos: number;
  readonly entregas_publicadas: number;
  readonly entregas_fallidas: number;
}

@Injectable()
export class PublicarEventosCambioEstadoUseCase {
  private readonly limitePorEjecucion = 100;
  private readonly limiteEntregasPorEjecucion = 500;

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
    let sinModulos = 0;

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

      if (modulosDestino.length === 0) {
        sinModulos += 1;
        continue;
      }

      for (const transicion of transiciones) {
        const evento = EventoContenido.crear(
          contenido,
          transicion,
          modulosDestino,
          ahora,
        );
        try {
          await this.registrarEvento(evento);
        } catch (error: unknown) {
          if (error instanceof EventoContenidoDuplicadoException) {
            duplicados += 1;
            continue;
          }

          throw error;
        }
      }
    }

    const entregas = await this.eventoRepository.buscarEntregasPendientes(
      this.limiteEntregasPorEjecucion,
    );
    const eventosConEntregaExitosa = new Set<bigint>();
    const eventosConFallo = new Set<bigint>();
    let entregasPublicadas = 0;
    let entregasFallidas = 0;

    for (const entrega of entregas) {
      const idEvento = entrega.evento.id_evento;
      if (idEvento === null) {
        continue;
      }

      const fechaIntento = new Date();

      try {
        await this.publisher.publicar(entrega.evento, entrega.modulo);
        await this.eventoRepository.marcarEntregaPublicada(
          idEvento,
          entrega.modulo.id_modulo,
          fechaIntento,
        );
        eventosConEntregaExitosa.add(idEvento);
        entregasPublicadas += 1;
      } catch (error: unknown) {
        await this.eventoRepository.registrarFalloEntrega(
          idEvento,
          entrega.modulo.id_modulo,
          fechaIntento,
          this.describirError(error),
        );
        eventosConFallo.add(idEvento);
        entregasFallidas += 1;
      }
    }

    publicados = [...eventosConEntregaExitosa].filter(
      (idEvento) => !eventosConFallo.has(idEvento),
    ).length;

    return {
      contenidos_revisados: pendientes.length,
      eventos_publicados: publicados,
      eventos_duplicados: duplicados,
      cambios_invalidos: invalidos,
      contenidos_sin_modulos: sinModulos,
      entregas_publicadas: entregasPublicadas,
      entregas_fallidas: entregasFallidas,
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

  private describirError(error: unknown): string {
    return error instanceof Error
      ? error.message
      : 'Fallo desconocido del bus interno.';
  }
}
