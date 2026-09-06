import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { ContenidoEstadoPendiente } from '../../domain/entities/contenido-estado-pendiente.entity';
import {
  EventoContenido,
  ModuloDestinoEvento,
} from '../../domain/entities/evento-contenido.entity';
import { EstadoContenido } from '../../domain/enums/estado-contenido.enum';
import { DatosEventoContenidoInvalidosException } from '../../domain/exeption/datos-evento-contenido-invalidos.exception';
import {
  EntregaEventoContenidoPendiente,
  EventoContenidoRepository,
} from '../../domain/repositories/evento-contenido.repository';

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

interface EntregaPendienteRow {
  id_evento: bigint | number | string;
  id_contenido_cronograma: string;
  id_cronograma: string;
  estado_anterior: string | null;
  estado_nuevo: string;
  fecha_cambio: Date;
  version_evento: string;
  payload: unknown;
  id_modulo: string;
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
    return this.prisma.$transaction(async (transaccion) => {
      const estadoAnterior = evento.estado_anterior
        ? Prisma.sql`CAST(${evento.estado_anterior} AS cronograma.estado_contenido_enum)`
        : Prisma.sql`NULL`;
      const filas = await transaccion.$queryRaw<
        EventoInsertadoRow[]
      >(Prisma.sql`
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

      const idEvento = BigInt(filas[0].id_evento);
      const entregas = evento.payload.modulos_destino.map(
        (modulo) =>
          Prisma.sql`(${idEvento}, CAST(${modulo.id_modulo} AS uuid))`,
      );

      await transaccion.$executeRaw(Prisma.sql`
        INSERT INTO cronograma.entregas_evento_contenido (
          id_evento,
          id_modulo
        )
        VALUES ${Prisma.join(entregas)}
        ON CONFLICT (id_evento, id_modulo) DO NOTHING
      `);

      return evento.marcarPersistido(idEvento);
    });
  }

  async buscarEntregasPendientes(
    limite: number,
  ): Promise<EntregaEventoContenidoPendiente[]> {
    const limiteSeguro = Math.min(Math.max(Math.trunc(limite), 1), 500);
    const filas = await this.prisma.$queryRaw<EntregaPendienteRow[]>(Prisma.sql`
      SELECT
        evento.id_evento,
        evento.id_contenido_cronograma,
        evento.id_cronograma,
        evento.estado_anterior::text AS estado_anterior,
        evento.estado_nuevo::text AS estado_nuevo,
        evento.fecha_cambio,
        evento.version_evento,
        evento.payload,
        entrega.id_modulo
      FROM cronograma.entregas_evento_contenido AS entrega
      INNER JOIN cronograma.eventos_contenido AS evento
        ON evento.id_evento = entrega.id_evento
      INNER JOIN cronograma.modulos_sistema AS modulo
        ON modulo.id_modulo = entrega.id_modulo
       AND modulo.activo = true
      WHERE entrega.fecha_publicacion IS NULL
      ORDER BY entrega.fecha_creacion,
               entrega.id_evento,
               entrega.id_modulo
      LIMIT ${limiteSeguro}
    `);

    return filas.map((fila) => {
      const evento = EventoContenido.rehidratar({
        id_evento: BigInt(fila.id_evento),
        id_contenido_cronograma: fila.id_contenido_cronograma,
        id_cronograma: fila.id_cronograma,
        estado_anterior: fila.estado_anterior
          ? this.convertirEstado(fila.estado_anterior)
          : null,
        estado_nuevo: this.convertirEstado(fila.estado_nuevo),
        fecha_cambio: new Date(fila.fecha_cambio),
        version_evento: fila.version_evento,
        payload: fila.payload,
      });
      const modulo = evento.payload.modulos_destino.find(
        (destino) => destino.id_modulo === fila.id_modulo,
      );

      if (!modulo) {
        throw new DatosEventoContenidoInvalidosException();
      }

      return { evento, modulo };
    });
  }

  async marcarEntregaPublicada(
    idEvento: bigint,
    idModulo: string,
    fechaPublicacion: Date,
  ): Promise<void> {
    await this.prisma.$executeRaw(Prisma.sql`
      UPDATE cronograma.entregas_evento_contenido
      SET fecha_publicacion = ${fechaPublicacion},
          fecha_ultimo_intento = ${fechaPublicacion},
          intentos_publicacion = intentos_publicacion + 1,
          ultimo_error = NULL
      WHERE id_evento = ${idEvento}
        AND id_modulo = CAST(${idModulo} AS uuid)
        AND fecha_publicacion IS NULL
    `);
  }

  async registrarFalloEntrega(
    idEvento: bigint,
    idModulo: string,
    fechaIntento: Date,
    detalle: string,
  ): Promise<void> {
    const detalleSeguro =
      detalle.trim().slice(0, 500) || 'Fallo desconocido del bus interno.';

    await this.prisma.$executeRaw(Prisma.sql`
      UPDATE cronograma.entregas_evento_contenido
      SET fecha_ultimo_intento = ${fechaIntento},
          intentos_publicacion = intentos_publicacion + 1,
          ultimo_error = ${detalleSeguro}
      WHERE id_evento = ${idEvento}
        AND id_modulo = CAST(${idModulo} AS uuid)
        AND fecha_publicacion IS NULL
    `);
  }

  private convertirEstado(valor: string): EstadoContenido {
    if (Object.values(EstadoContenido).includes(valor as EstadoContenido)) {
      return valor as EstadoContenido;
    }

    throw new DatosEventoContenidoInvalidosException();
  }
}
