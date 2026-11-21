import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import {
  ConsultaHistorialInteracciones,
  HistorialInteraccionesRepository,
  InteraccionRegistrada,
  PaginaHistorialInteracciones,
} from '../../domain/repositories/historial-interacciones.repository';
import { validarHistorialSesion } from './prisma-validar-historial-sesion';

/**
 * RF-31 / RF-32: lee `chat.interacciones` con su respuesta válida. Usa la clave
 * única (id_sesion, secuencia); no escribe en ninguna tabla.
 */
@Injectable()
export class PrismaHistorialInteraccionesRepository implements HistorialInteraccionesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async consultar({
    idSesion,
    antesDe,
    limite,
  }: ConsultaHistorialInteracciones): Promise<PaginaHistorialInteracciones | null> {
    return this.prisma.$transaction(
      async (tx) => {
        if (!(await validarHistorialSesion(tx, idSesion))) return null;

        const filas = await tx.interacciones.findMany({
          where: {
            id_sesion: idSesion,
            ...(antesDe === null ? {} : { secuencia: { lt: antesDe } }),
          },
          orderBy: { secuencia: 'desc' },
          // Una fila extra indica si quedan interacciones más antiguas.
          take: limite + 1,
          select: {
            id_interaccion: true,
            secuencia: true,
            timestamp_interaccion: true,
            id_nodo: true,
            historial_nodos: { select: { id_nodo_destino: true } },
            respuestas: {
              where: { es_valida: true },
              take: 1,
              select: {
                valor_respuesta: true,
                tipo_entrada: { select: { nombre: true } },
              },
            },
          },
        });

        const pagina = filas.slice(0, limite).reverse();
        const sinVinculo = pagina
          .filter((fila) => fila.historial_nodos === null)
          .map((fila) => fila.id_interaccion);
        const destinosHistoricos = await this.buscarDestinosSinVinculo(
          tx,
          sinVinculo,
        );
        const interacciones: InteraccionRegistrada[] = [];
        for (const fila of pagina) {
          const respuesta = fila.respuestas[0];
          const idNodoDestino =
            fila.historial_nodos?.id_nodo_destino ??
            destinosHistoricos.get(fila.id_interaccion);
          if (respuesta === undefined || idNodoDestino === undefined)
            return null;
          interacciones.push({
            idInteraccion: fila.id_interaccion,
            secuencia: fila.secuencia,
            timestampInteraccion: fila.timestamp_interaccion,
            idNodo: fila.id_nodo,
            idNodoDestino,
            tipoEntrada: respuesta.tipo_entrada.nombre,
            valor: respuesta.valor_respuesta,
          });
        }
        return { hayMas: filas.length > limite, interacciones };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  /** Los pasos previos al vínculo solo se recuperan con una coincidencia exacta y única. */
  private async buscarDestinosSinVinculo(
    tx: Prisma.TransactionClient,
    ids: string[],
  ): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map();
    const identificadores = Prisma.join(
      ids.map((id) => Prisma.sql`${id}::uuid`),
    );
    const destinos = await tx.$queryRaw<
      { id_interaccion: string; destino: string }[]
    >`
      SELECT i.id_interaccion, min(h.id_nodo_destino::text) AS destino
      FROM chat.interacciones i
      JOIN chat.historial_nodos h
        ON (h.id_sesion, h.id_nodo, h.timestamp_interaccion) =
           (i.id_sesion, i.id_nodo, i.timestamp_interaccion)
      WHERE i.id_interaccion IN (${identificadores})
        AND h.id_interaccion IS NULL AND h.estado_registro = 'REGISTRADO'
        AND h.id_nodo_destino IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM chat.interacciones otra
          WHERE otra.id_interaccion <> i.id_interaccion
            AND (otra.id_sesion, otra.id_nodo, otra.timestamp_interaccion) =
                (i.id_sesion, i.id_nodo, i.timestamp_interaccion)
        )
      GROUP BY i.id_interaccion HAVING count(*) = 1`;
    return new Map(destinos.map((fila) => [fila.id_interaccion, fila.destino]));
  }
}
