import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { ContenidoEstadoPendiente } from '../../domain/entities/contenido-estado-pendiente.entity';
import { EventoContenido, ModuloDestinoEvento} from '../../domain/entities/evento-contenido.entity';
import { EstadoContenido } from '../../domain/enums/estado-contenido.enum';
import { DatosEventoContenidoInvalidosException } from '../../domain/exeption/datos-evento-contenido-invalidos.exception';
import { EventoContenidoRepository } from '../../domain/repositories/evento-contenido.repository';

interface CambioPendienteRow {
  id_contenido_cronograma: string;
  id_contenido: string;
  id_cronograma: string;
  estado_actual: string;
  ultimo_estado_publicado: string | null;
}

interface EventoInsertadoRow {
  id_evento: bigint | number | string;
}

@Injectable()
export class PrismaEventoContenidoRepository implements EventoContenidoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarCambiosPendientes(
    limite: number,
  ): Promise<ContenidoEstadoPendiente[]> {
    const limiteSeguro = Math.min(Math.max(Math.trunc(limite), 1), 500);
    const filas = await this.prisma.$queryRaw<CambioPendienteRow[]>(Prisma.sql`
      SELECT
        vista.id_contenido_cronograma,
        vista.id_contenido,
        vista.id_cronograma,
        vista.estado_actual::text AS estado_actual,
        ultimo.estado_nuevo::text AS ultimo_estado_publicado
      FROM cronograma.v_contenidos_estado AS vista
      LEFT JOIN LATERAL (
        SELECT evento.estado_nuevo
        FROM cronograma.eventos_contenido AS evento
        WHERE evento.id_contenido_cronograma = vista.id_contenido_cronograma
        ORDER BY evento.id_evento DESC
        LIMIT 1
      ) AS ultimo ON TRUE
      WHERE ultimo.estado_nuevo IS DISTINCT FROM vista.estado_actual
      ORDER BY vista.fecha_inicio_disponibilidad NULLS LAST,
               vista.id_contenido_cronograma
      LIMIT ${limiteSeguro}
    `);

    return filas.map(
      (fila) =>
        new ContenidoEstadoPendiente(
          fila.id_contenido_cronograma,
          fila.id_contenido,
          fila.id_cronograma,
          this.convertirEstado(fila.estado_actual),
          fila.ultimo_estado_publicado
            ? this.convertirEstado(fila.ultimo_estado_publicado)
            : null,
        ),
    );
  }

  async buscarModulosDestinoPorContenido(
    idsContenido: string[],
  ): Promise<Map<string, ModuloDestinoEvento[]>> {
    const idsUnicos = [...new Set(idsContenido)];
    const resultado = new Map<string, ModuloDestinoEvento[]>(
      idsUnicos.map((idContenido) => [idContenido, []]),
    );

    if (idsUnicos.length === 0) {
      return resultado;
    }

    const recursos = await this.prisma.recursos_contenido.findMany({
      where: { id_contenido: { in: idsUnicos } },
      select: {
        id_contenido: true,
        recursos_modulos_destino: {
          where: { modulos_sistema: { activo: true } },
          select: {
            modulos_sistema: {
              select: {
                id_modulo: true,
                codigo_modulo: true,
                nombre_modulo: true,
              },
            },
          },
        },
      },
    });

    const modulosPorContenido = new Map<
      string,
      Map<string, ModuloDestinoEvento>
    >();

    for (const recurso of recursos) {
      const modulos =
        modulosPorContenido.get(recurso.id_contenido) ??
        new Map<string, ModuloDestinoEvento>();

      for (const destino of recurso.recursos_modulos_destino) {
        const modulo = destino.modulos_sistema;
        modulos.set(modulo.id_modulo, modulo);
      }

      modulosPorContenido.set(recurso.id_contenido, modulos);
    }

    for (const [idContenido, modulos] of modulosPorContenido) {
      resultado.set(idContenido, [...modulos.values()]);
    }

    return resultado;
  }

  async registrarSiNoExiste(
    evento: EventoContenido,
  ): Promise<EventoContenido | null> {
    const estadoAnterior = evento.estado_anterior
      ? Prisma.sql`CAST(${evento.estado_anterior} AS cronograma.estado_contenido_enum)`
      : Prisma.sql`NULL`;
    const filas = await this.prisma.$queryRaw<EventoInsertadoRow[]>(Prisma.sql`
      INSERT INTO cronograma.eventos_contenido (
        id_contenido_cronograma,
        id_cronograma,
        estado_anterior,
        estado_nuevo,
        fecha_cambio,
        version_evento,
        payload
      )
      VALUES (
        CAST(${evento.id_contenido_cronograma} AS uuid),
        CAST(${evento.id_cronograma} AS uuid),
        ${estadoAnterior},
        CAST(${evento.estado_nuevo} AS cronograma.estado_contenido_enum),
        ${evento.fecha_cambio},
        ${evento.version_evento},
        CAST(${JSON.stringify(evento.payload)} AS jsonb)
      )
      ON CONFLICT (id_contenido_cronograma, estado_nuevo) DO NOTHING
      RETURNING id_evento
    `);

    if (filas.length === 0) {
      return null;
    }

    return evento.marcarPersistido(BigInt(filas[0].id_evento));
  }

  private convertirEstado(valor: string): EstadoContenido {
    if (Object.values(EstadoContenido).includes(valor as EstadoContenido)) {
      return valor as EstadoContenido;
    }

    throw new DatosEventoContenidoInvalidosException();
  }
}
