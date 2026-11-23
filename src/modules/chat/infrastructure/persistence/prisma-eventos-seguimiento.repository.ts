import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import {
  EventoSesionFinalizada,
  TIPO_EVENTO_SESION_FINALIZADA,
} from '../../application/ports/evento-sesion-finalizada';
import {
  EventoSeguimientoChat,
  EventoSosActivado,
  TIPO_EVENTO_SOS_ACTIVADO,
} from '../../application/ports/evento-sos-activado';
import { NIVEL_CRAVING_SOS } from '../../domain/enums/intervencion-sos.enum';

type FilaEvento = Omit<
  EventoSesionFinalizada,
  'tipo' | 'version' | 'timestamp'
> & {
  tipo_evento: string;
  timestamp: Date;
  // RF-43: columnas de la intervención (null en CHAT_SESION_FINALIZADA).
  id_intervencion: string | null;
  duracion_segundos: number | null;
  estado_intervencion: string | null;
  estado_sesion_anterior: string | null;
};

function aEvento(fila: FilaEvento): EventoSeguimientoChat {
  if (fila.tipo_evento === TIPO_EVENTO_SOS_ACTIVADO) {
    return {
      id_evento: fila.id_evento,
      tipo: TIPO_EVENTO_SOS_ACTIVADO,
      version: '1.0',
      id_usuario: fila.id_usuario,
      id_intervencion: fila.id_intervencion!,
      timestamp_craving: fila.timestamp.toISOString(),
      tipo_craving: fila.tipo_craving,
      duracion_intervencion: fila.duracion_segundos ?? 0,
      estado_intervencion:
        fila.estado_intervencion as EventoSosActivado['estado_intervencion'],
      nivel_craving: NIVEL_CRAVING_SOS,
      estado_sesion_anterior:
        fila.estado_sesion_anterior as EventoSosActivado['estado_sesion_anterior'],
    };
  }
  return {
    id_evento: fila.id_evento,
    tipo: TIPO_EVENTO_SESION_FINALIZADA,
    version: '1.0',
    id_usuario: fila.id_usuario,
    id_sesion: fila.id_sesion,
    modalidad: fila.modalidad,
    tipo_dependencia: fila.tipo_dependencia,
    tipo_craving: fila.tipo_craving,
    origen_evento: fila.origen_evento,
    timestamp: fila.timestamp.toISOString(),
  };
}

@Injectable()
export class PrismaEventosSeguimientoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async reservarPendientes(
    reenvioMs: number,
  ): Promise<EventoSeguimientoChat[]> {
    const filas = await this.prisma.$queryRaw<FilaEvento[]>`
      WITH pendientes AS (
        SELECT id_evento FROM chat.eventos_seguimiento
        WHERE estado <> 'ENTREGADO' AND proximo_envio_en <= now()
        ORDER BY proximo_envio_en, id_evento
        LIMIT 50 FOR UPDATE SKIP LOCKED
      )
      UPDATE chat.eventos_seguimiento e
      SET proximo_envio_en = now() + ${reenvioMs}::integer * interval '1 millisecond'
      FROM pendientes p
      WHERE e.id_evento = p.id_evento
      RETURNING e.id_evento, e.id_usuario, e.id_sesion, e.modalidad::text AS modalidad,
        e.tipo_dependencia::text AS tipo_dependencia, e.tipo_craving::text AS tipo_craving,
        e.origen_evento::text AS origen_evento, e.tipo_evento::text AS tipo_evento,
        e.timestamp, e.id_intervencion_sos AS id_intervencion,
        (SELECT s.duracion_segundos FROM chat.intervenciones_sos s
          WHERE s.id_intervencion = e.id_intervencion_sos) AS duracion_segundos,
        (SELECT s.estado::text FROM chat.intervenciones_sos s
          WHERE s.id_intervencion = e.id_intervencion_sos) AS estado_intervencion,
        (SELECT s.estado_sesion_anterior::text FROM chat.intervenciones_sos s
          WHERE s.id_intervencion = e.id_intervencion_sos) AS estado_sesion_anterior
    `;
    return filas.map(aEvento);
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
