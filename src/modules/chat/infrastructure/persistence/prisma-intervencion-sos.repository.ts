import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import {
  IntervencionSosPort,
  IntervencionSosTransaccion,
  NuevaIntervencionSos,
  RecursoApoyo,
} from '../../application/ports/intervencion-sos.port';
import { SesionConversacional } from '../../domain/entities/sesion/sesion-conversacional.entity';
import {
  ContextoOrigenSos,
  IntervencionSos,
} from '../../domain/entities/sos/intervencion-sos.entity';
import {
  EstadoIntervencionSos,
  EstadoSesionAnteriorSos,
} from '../../domain/enums/intervencion-sos.enum';
import { TipoCravingClinico } from '../../domain/enums/perfil-clinico.enum';
import { SesionConversacionalMapper } from '../mappers/sesion-conversacional.mapper';
import { actualizarSesionConversacional } from './prisma-actualizar-sesion-conversacional';
import { PrismaContextoRespuestaRepository } from './prisma-contexto-respuesta.repository';
import { sesionPendiente } from './prisma-sesion-conversacional.repository';

/**
 * Margen antes de que el cron expire una intervención vencida. Le da tiempo al
 * cliente de llamar `finalizar` con TIEMPO_AGOTADO; la duración igual se topa
 * en 60 s.
 */
const GRACIA_EXPIRACION_SEGUNDOS = 30;

interface FilaIntervencion {
  id_intervencion: string;
  id_usuario: string;
  id_sesion_sos: string;
  id_sesion_pausada: string | null;
  estado_sesion_anterior: string;
  tipo_craving: string | null;
  estado: string;
  contexto_origen: unknown;
  fecha_activacion: Date;
  fecha_limite: Date;
  duracion_segundos: number | null;
  vencida: boolean;
}

/** Columnas de una intervención; `vencida` se calcula con el reloj de PostgreSQL. */
const COLUMNAS = Prisma.sql`
  id_intervencion, id_usuario, id_sesion_sos, id_sesion_pausada,
  estado_sesion_anterior::text AS estado_sesion_anterior,
  tipo_craving::text AS tipo_craving, estado::text AS estado, contexto_origen,
  fecha_activacion, fecha_limite, duracion_segundos,
  (estado = 'EN_CURSO' AND statement_timestamp() >= fecha_limite) AS vencida`;

function aDominio(fila: FilaIntervencion): IntervencionSos {
  return new IntervencionSos(
    fila.id_intervencion,
    fila.id_usuario,
    fila.id_sesion_sos,
    fila.id_sesion_pausada,
    fila.estado_sesion_anterior as EstadoSesionAnteriorSos,
    fila.tipo_craving as TipoCravingClinico | null,
    fila.estado as EstadoIntervencionSos,
    (fila.contexto_origen ?? null) as ContextoOrigenSos | null,
    fila.fecha_activacion,
    fila.fecha_limite,
    fila.duracion_segundos,
    fila.vencida,
  );
}

/**
 * RF-43: las tablas nuevas se leen y escriben con SQL parametrizado hasta que
 * el workflow `prisma-generate-schema` regenere `schema.prisma` tras el merge
 * (misma decisión que RF-25 con `es_nodo_final`).
 */
class PrismaIntervencionSosTransaccion implements IntervencionSosTransaccion {
  constructor(private readonly tx: Prisma.TransactionClient) {}

  async bloquearUsuario(idUsuario: string): Promise<void> {
    await this.tx
      .$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${idUsuario}))`;
  }

  async buscarEnCurso(idUsuario: string): Promise<IntervencionSos | null> {
    const [fila] = await this.tx.$queryRaw<FilaIntervencion[]>`
      SELECT ${COLUMNAS} FROM chat.intervenciones_sos
      WHERE id_usuario = ${idUsuario}::uuid AND estado = 'EN_CURSO'
      FOR UPDATE`;
    return fila === undefined ? null : aDominio(fila);
  }

  async bloquear(
    idIntervencion: string,
    idUsuario: string,
  ): Promise<IntervencionSos | null> {
    const [fila] = await this.tx.$queryRaw<FilaIntervencion[]>`
      SELECT ${COLUMNAS} FROM chat.intervenciones_sos
      WHERE id_intervencion = ${idIntervencion}::uuid
        AND id_usuario = ${idUsuario}::uuid
      FOR UPDATE`;
    return fila === undefined ? null : aDominio(fila);
  }

  async cerrar(
    idIntervencion: string,
    estado: EstadoIntervencionSos,
  ): Promise<boolean> {
    const [fila] = await this.tx.$queryRaw<{ cerrada: boolean }[]>`
      SELECT chat.fn_cerrar_intervencion_sos(
        ${idIntervencion}::uuid,
        ${estado}::chat.estado_intervencion_sos_enum
      ) AS cerrada`;
    return fila.cerrada;
  }

  async buscarSesionDeTerapiaPendiente(
    idUsuario: string,
  ): Promise<SesionConversacional | null> {
    const pendiente = await this.tx.chat_sesiones.findFirst({
      where: sesionPendiente(idUsuario),
      select: { id_sesion: true },
      orderBy: [
        { fecha_ultima_interaccion: 'desc' },
        { fecha_inicio: 'desc' },
        { id_sesion: 'desc' },
      ],
    });
    if (pendiente === null) return null;
    // Mismo bloqueo que RF-30: una respuesta concurrente espera a la pausa.
    return new PrismaContextoRespuestaRepository(this.tx).bloquearSesion(
      pendiente.id_sesion,
      idUsuario,
    );
  }

  pausarSesion(sesion: SesionConversacional): Promise<void> {
    return actualizarSesionConversacional(this.tx, sesion, 'ACTIVA');
  }

  async crearSesionSos(sesion: SesionConversacional): Promise<void> {
    await this.tx.chat_sesiones.create({
      data: SesionConversacionalMapper.toCreateData(sesion),
    });
  }

  async registrar(datos: NuevaIntervencionSos): Promise<IntervencionSos> {
    const contexto =
      datos.contextoOrigen === null
        ? null
        : JSON.stringify(datos.contextoOrigen);
    const [fila] = await this.tx.$queryRaw<FilaIntervencion[]>`
      INSERT INTO chat.intervenciones_sos (
        id_usuario, id_sesion_sos, id_sesion_pausada, estado_sesion_anterior,
        tipo_craving, contexto_origen
      ) VALUES (
        ${datos.idUsuario}::uuid,
        ${datos.idSesionSos}::uuid,
        ${datos.idSesionPausada}::uuid,
        ${datos.estadoSesionAnterior}::chat.estado_sesion_anterior_sos_enum,
        ${datos.tipoCraving}::chat.tipo_craving_enum,
        ${contexto}::jsonb
      )
      RETURNING ${COLUMNAS}`;
    return aDominio(fila);
  }
}

@Injectable()
export class PrismaIntervencionSosRepository implements IntervencionSosPort {
  constructor(private readonly prisma: PrismaService) {}

  ejecutar<T>(
    operacion: (tx: IntervencionSosTransaccion) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(
      (tx) => operacion(new PrismaIntervencionSosTransaccion(tx)),
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: 10000,
        timeout: 10000,
      },
    );
  }

  listarRecursosApoyo(): Promise<RecursoApoyo[]> {
    return this.prisma.$queryRaw<RecursoApoyo[]>`
      SELECT nombre, telefono FROM chat.recursos_apoyo
      WHERE activo ORDER BY orden, nombre`;
  }

  async expirarVencidas(limite: number): Promise<number> {
    const [fila] = await this.prisma.$queryRaw<{ cerradas: number }[]>`
      WITH vencidas AS (
        SELECT id_intervencion FROM chat.intervenciones_sos
        WHERE estado = 'EN_CURSO'
          AND fecha_limite < statement_timestamp()
            - ${GRACIA_EXPIRACION_SEGUNDOS}::integer * interval '1 second'
        ORDER BY fecha_limite
        LIMIT ${limite}::integer
        FOR UPDATE SKIP LOCKED
      )
      SELECT count(*) FILTER (
        WHERE chat.fn_cerrar_intervencion_sos(id_intervencion, 'EXPIRADA')
      )::integer AS cerradas
      FROM vencidas`;
    return fila.cerradas;
  }

  purgarContextos(horas: number): Promise<number> {
    return this.prisma.$executeRaw`
      UPDATE chat.intervenciones_sos SET contexto_origen = NULL
      WHERE contexto_origen IS NOT NULL
        AND fecha_cierre < statement_timestamp()
          - ${horas}::integer * interval '1 hour'`;
  }
}
