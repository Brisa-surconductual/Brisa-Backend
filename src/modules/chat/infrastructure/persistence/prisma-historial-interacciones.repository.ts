import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { cacheTipoEntrada } from './catalogo-tipos-cache';
import { PrismaService } from '../../../../../prisma/prisma.service';
import {
  ConsultaHistorialInteracciones,
  HistorialInteraccionesRepository,
  InteraccionRegistrada,
  PaginaHistorialInteracciones,
  RegistroTrazabilidad,
} from '../../domain/repositories/historial-interacciones.repository';
import { validarHistorialSesion } from './prisma-validar-historial-sesion';

const SELECCION_INTERACCION = {
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
      id_tipo_entrada: true,
    },
  },
} satisfies Prisma.interaccionesSelect;

type FilaInteraccion = Prisma.interaccionesGetPayload<{
  select: typeof SELECCION_INTERACCION;
}>;

/**
 * RF-31 / RF-32: lee `chat.interacciones` con su respuesta válida. Usa la clave
 * única (id_sesion, secuencia); no escribe en ninguna tabla.
 */
@Injectable()
export class PrismaHistorialInteraccionesRepository implements HistorialInteraccionesRepository {
  constructor(private readonly prisma: PrismaService) {}

  consultar(
    consulta: ConsultaHistorialInteracciones,
  ): Promise<PaginaHistorialInteracciones | null> {
    return this.prisma.$transaction((tx) => this.consultarEn(tx, consulta), {
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    });
  }

  async consultarEn(
    tx: Prisma.TransactionClient,
    { idSesion, antesDe, limite }: ConsultaHistorialInteracciones,
  ): Promise<PaginaHistorialInteracciones | null> {
    if (!(await validarHistorialSesion(tx, idSesion))) return null;

    const filas = await tx.interacciones.findMany({
      where: {
        id_sesion: idSesion,
        ...(antesDe === null ? {} : { secuencia: { lt: antesDe } }),
      },
      orderBy: { secuencia: 'desc' },
      // Una fila extra indica si quedan interacciones más antiguas.
      take: limite + 1,
      select: SELECCION_INTERACCION,
    });

    const pagina = filas.slice(0, limite).reverse();
    const registros = await this.mapear(tx, pagina, false);
    if (registros === null) return null;
    const interacciones: InteraccionRegistrada[] = [];
    for (const registro of registros) {
      // RF-31: cada paso del historial del estudiante tiene destino comprobable.
      if (registro.idNodoDestino === null) return null;
      interacciones.push({
        ...registro,
        idNodoDestino: registro.idNodoDestino,
      });
    }
    return { hayMas: filas.length > limite, interacciones };
  }

  /**
   * Trazabilidad: la secuencia completa en orden ascendente, en una lectura
   * consistente. Una fila de historial con destino NULL es el fin del flujo.
   */
  consultarCompleta(idSesion: string): Promise<RegistroTrazabilidad[] | null> {
    return this.prisma.$transaction(
      async (tx) => {
        if (!(await validarHistorialSesion(tx, idSesion))) return null;
        const filas = await tx.interacciones.findMany({
          where: { id_sesion: idSesion },
          orderBy: { secuencia: 'asc' },
          select: SELECCION_INTERACCION,
        });
        return this.mapear(tx, filas, true);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  /**
   * Une cada interacción con su respuesta válida y su destino. Devuelve null
   * si a una le falta la respuesta o un destino comprobable. Con
   * `finSinDestino`, una fila de historial con destino NULL vale como fin.
   */
  private async mapear(
    tx: Prisma.TransactionClient,
    filas: FilaInteraccion[],
    finSinDestino: boolean,
  ): Promise<RegistroTrazabilidad[] | null> {
    const sinVinculo = filas
      .filter((fila) => fila.historial_nodos === null)
      .map((fila) => fila.id_interaccion);
    const destinosHistoricos = await this.buscarDestinosSinVinculo(
      tx,
      sinVinculo,
    );
    const registros: RegistroTrazabilidad[] = [];
    for (const fila of filas) {
      const respuesta = fila.respuestas[0];
      if (respuesta === undefined) return null;
      const vinculado = fila.historial_nodos;
      let idNodoDestino: string | null | undefined;
      if (vinculado === null) {
        idNodoDestino = destinosHistoricos.get(fila.id_interaccion);
      } else if (vinculado.id_nodo_destino !== null) {
        idNodoDestino = vinculado.id_nodo_destino;
      } else {
        idNodoDestino = finSinDestino ? null : undefined;
      }
      if (idNodoDestino === undefined) return null;
      const nombreTipoEntrada = await cacheTipoEntrada.nombre(
        tx,
        respuesta.id_tipo_entrada,
      );
      if (nombreTipoEntrada === undefined) return null;
      registros.push({
        idInteraccion: fila.id_interaccion,
        secuencia: fila.secuencia,
        timestampInteraccion: fila.timestamp_interaccion,
        idNodo: fila.id_nodo,
        idNodoDestino,
        tipoEntrada: nombreTipoEntrada,
        valor: respuesta.valor_respuesta,
      });
    }
    return registros;
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
