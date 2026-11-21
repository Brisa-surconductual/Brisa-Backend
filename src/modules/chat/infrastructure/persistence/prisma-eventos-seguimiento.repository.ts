import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import {
  EventoSesionFinalizada,
  TIPO_EVENTO_SESION_FINALIZADA,
} from '../../application/ports/evento-sesion-finalizada';

type FilaEvento = Omit<
  EventoSesionFinalizada,
  'tipo' | 'version' | 'timestamp'
> & {
  timestamp: Date;
};

@Injectable()
export class PrismaEventosSeguimientoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async reservarPendientes(
    reenvioMs: number,
  ): Promise<EventoSesionFinalizada[]> {
    const filas = await this.prisma.$queryRaw<FilaEvento[]>`
      WITH pendientes AS (
        SELECT id_evento FROM chat.eventos_seguimiento
        WHERE estado <> 'ENTREGADO' AND proximo_envio_en <= now()
        ORDER BY proximo_envio_en, id_evento
        LIMIT 50 FOR UPDATE SKIP LOCKED
      )
      UPDATE chat.eventos_seguimiento e
      SET proximo_envio_en = now() + ${reenvioMs}::integer * interval '1 millisecond'
      FROM pendientes p WHERE e.id_evento = p.id_evento
      RETURNING e.id_evento, e.id_usuario, e.id_sesion, e.modalidad::text AS modalidad,
        e.tipo_dependencia::text AS tipo_dependencia, e.tipo_craving::text AS tipo_craving,
        e.origen_evento::text AS origen_evento, e.timestamp
    `;
    return filas.map((fila) => ({
      ...fila,
      tipo: TIPO_EVENTO_SESION_FINALIZADA,
      version: '1.0',
      timestamp: fila.timestamp.toISOString(),
    }));
  }

  async estaPendiente(idEvento: string): Promise<boolean> {
    const [fila] = await this.prisma.$queryRaw<{ pendiente: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM chat.eventos_seguimiento
        WHERE id_evento = ${idEvento}::uuid AND estado <> 'ENTREGADO'
      ) AS pendiente
    `;
    return fila.pendiente;
  }

  async marcarEntregado(idEvento: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE chat.eventos_seguimiento SET estado = 'ENTREGADO', entregado_en = now()
      WHERE id_evento = ${idEvento}::uuid AND estado <> 'ENTREGADO'
    `;
  }

  async marcarError(idEventos: string[]): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE chat.eventos_seguimiento SET estado = 'ERROR_REINTENTO'
      WHERE id_evento = ANY(ARRAY[${Prisma.join(idEventos)}]::uuid[])
        AND estado <> 'ENTREGADO'
    `;
  }
}
