import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { SesionConversacional } from '../../domain/entities/sesion/sesion-conversacional.entity';
import {
  ArbolYaCompletadoException,
  EstadoSesionInconsistenteException,
  SesionActivaExistenteException,
} from '../../domain/exceptions/sesion.exceptions';
import {
  CursorSesionesParticipante,
  PaginaSesionesParticipante,
  SesionConversacionalRepository,
} from '../../domain/repositories/sesion-conversacional.repository';
import { EstadoSesionConversacional } from '../../domain/entities/sesion/sesion-conversacional.entity';
import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';
import { SesionConversacionalMapper } from '../mappers/sesion-conversacional.mapper';
import { actualizarSesionConversacional } from './prisma-actualizar-sesion-conversacional';

const SESION_NO_COMPLETADA: Prisma.chat_sesionesWhereInput = {
  OR: [
    { estado_sesiones: { is: { estado_actual: { not: 'COMPLETADA' } } } },
    { estado_sesiones: { is: null } },
  ],
};

const SESION_COMPLETADA: Prisma.chat_sesionesWhereInput = {
  estado_sesiones: { is: { estado_actual: 'COMPLETADA' } },
};

/**
 * RF-43: las sesiones SOS corren aparte de la sesión de terapia; nunca cuentan
 * como sesión pendiente ni se reanudan desde RF-32.
 */
const SESION_DE_TERAPIA: Prisma.chat_sesionesWhereInput = {
  modalidad_activa: { in: ['GRUPAL', 'PERSONALIZADA'] },
};

/**
 * Sesión pendiente que no duplica un árbol ya completado por el mismo usuario.
 * `id_flujo` es la clave del flujo, así que identifica también su versión.
 */
export function sesionPendiente(
  idUsuario: string,
): Prisma.chat_sesionesWhereInput {
  return {
    id_usuario: idUsuario,
    AND: [
      SESION_DE_TERAPIA,
      SESION_NO_COMPLETADA,
      {
        OR: [
          { id_flujo_conversacional: null },
          {
            flujo_conversacion: {
              is: {
                sesiones: {
                  none: { id_usuario: idUsuario, ...SESION_COMPLETADA },
                },
              },
            },
          },
        ],
      },
    ],
  };
}

function sesionCompletadaDelArbol(
  idUsuario: string,
  idFlujo: string,
  version: number,
): Prisma.chat_sesionesWhereInput {
  return {
    id_usuario: idUsuario,
    id_flujo_conversacional: idFlujo,
    version_arbol_utilizada: version,
    ...SESION_COMPLETADA,
  };
}

interface FilaResumenSesion {
  id_sesion: string;
  id_usuario: string;
  modalidad: string;
  estado: string;
  fecha_inicio: Date;
  fecha_ultima_interaccion: Date;
  marca_orden: string;
}

@Injectable()
export class PrismaSesionConversacionalRepository implements SesionConversacionalRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * RF-38 (M-8). Paginación por conjunto (keyset) sobre
   * (fecha_ultima_interaccion, id_sesion) descendente: estable aunque se
   * creen sesiones nuevas. La marca de orden conserva los microsegundos de la
   * BD, porque `Date` de JS los trunca y el cursor podría saltar o repetir
   * sesiones. Página y total se leen en la misma instantánea (RepeatableRead).
   * Solo cuenta sesiones con estado registrado, como `buscarPorId`.
   */
  listarPorUsuario(
    idUsuario: string,
    limite: number,
    despuesDe: CursorSesionesParticipante | null,
  ): Promise<PaginaSesionesParticipante> {
    return this.prisma.$transaction(
      async (tx) => {
        const filas = await tx.$queryRaw<FilaResumenSesion[]>`
          SELECT s.id_sesion::text AS id_sesion,
                 s.id_usuario::text AS id_usuario,
                 s.modalidad_activa::text AS modalidad,
                 e.estado_actual::text AS estado,
                 s.fecha_inicio,
                 s.fecha_ultima_interaccion,
                 to_char(s.fecha_ultima_interaccion AT TIME ZONE 'UTC',
                         'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS marca_orden
            FROM chat.sesiones s
            JOIN chat.estado_sesiones e ON e.id_sesion = s.id_sesion
           WHERE s.id_usuario = ${idUsuario}::uuid
             AND (${despuesDe?.fechaUltimaInteraccion ?? null}::timestamptz IS NULL
                  OR (s.fecha_ultima_interaccion, s.id_sesion)
                     < (${despuesDe?.fechaUltimaInteraccion ?? null}::timestamptz,
                        ${despuesDe?.idSesion ?? null}::uuid))
           ORDER BY s.fecha_ultima_interaccion DESC, s.id_sesion DESC
           LIMIT ${limite + 1}`;
        const [{ total }] = await tx.$queryRaw<{ total: number }[]>`
          SELECT count(*)::int AS total
            FROM chat.sesiones s
            JOIN chat.estado_sesiones e ON e.id_sesion = s.id_sesion
           WHERE s.id_usuario = ${idUsuario}::uuid`;
        return {
          sesiones: filas.slice(0, limite).map((fila) => ({
            idSesion: fila.id_sesion,
            idUsuario: fila.id_usuario,
            modalidad: fila.modalidad as ModalidadConversacional,
            estado: fila.estado as EstadoSesionConversacional,
            fechaInicio: fila.fecha_inicio,
            fechaUltimaInteraccion: fila.fecha_ultima_interaccion,
            marcaOrden: fila.marca_orden,
          })),
          total,
          hayMas: filas.length > limite,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  async buscarPorId(idSesion: string): Promise<SesionConversacional | null> {
    const sesion = await this.prisma.chat_sesiones.findUnique({
      where: { id_sesion: idSesion },
      include: { estado_sesiones: true },
    });
    if (sesion === null || sesion.estado_sesiones === null) return null;
    return SesionConversacionalMapper.toDomain(sesion);
  }

  async buscarPorIdYUsuario(
    idSesion: string,
    idUsuario: string,
  ): Promise<SesionConversacional | null> {
    const sesion = await this.prisma.chat_sesiones.findFirst({
      where: { id_sesion: idSesion, id_usuario: idUsuario },
      include: { estado_sesiones: true },
    });
    if (sesion === null || sesion.estado_sesiones === null) return null;
    return SesionConversacionalMapper.toDomain(sesion);
  }

  async buscarUltimaNoCompletada(
    idUsuario: string,
  ): Promise<SesionConversacional | null> {
    const sesion = await this.prisma.chat_sesiones.findFirst({
      where: sesionPendiente(idUsuario),
      include: { estado_sesiones: true },
      orderBy: [
        { fecha_ultima_interaccion: 'desc' },
        { fecha_inicio: 'desc' },
        { id_sesion: 'desc' },
      ],
    });

    if (sesion === null) return null;
    if (sesion.estado_sesiones === null)
      throw new EstadoSesionInconsistenteException();
    return SesionConversacionalMapper.toDomain(sesion);
  }

  async buscarCompletadaDelArbol(
    idUsuario: string,
    idFlujo: string,
    version: number,
  ): Promise<SesionConversacional | null> {
    const sesion = await this.prisma.chat_sesiones.findFirst({
      where: sesionCompletadaDelArbol(idUsuario, idFlujo, version),
      include: { estado_sesiones: true },
      orderBy: [
        { fecha_ultima_interaccion: 'desc' },
        { fecha_inicio: 'desc' },
        { id_sesion: 'desc' },
      ],
    });
    if (sesion === null || sesion.estado_sesiones === null) return null;
    return SesionConversacionalMapper.toDomain(sesion);
  }

  async guardar(sesion: SesionConversacional): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        const existente = await tx.chat_sesiones.findUnique({
          where: { id_sesion: sesion.idSesion },
          include: { estado_sesiones: true },
        });
        if (existente !== null) {
          await actualizarSesionConversacional(
            tx,
            sesion,
            existente.estado_sesiones?.estado_actual,
          );
          return;
        }

        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${sesion.idUsuario}))`;
        const pendiente = await tx.chat_sesiones.findFirst({
          where: sesionPendiente(sesion.idUsuario),
          select: {
            id_sesion: true,
            estado_sesiones: { select: { estado_actual: true } },
          },
        });
        if (pendiente === null) {
          if (
            sesion.idFlujoConversacional !== null &&
            sesion.versionArbolUtilizada !== null
          ) {
            const completada = await tx.chat_sesiones.findFirst({
              where: sesionCompletadaDelArbol(
                sesion.idUsuario,
                sesion.idFlujoConversacional,
                sesion.versionArbolUtilizada,
              ),
              select: { id_sesion: true },
            });
            if (completada !== null) throw new ArbolYaCompletadoException();
          }
          await tx.chat_sesiones.create({
            data: SesionConversacionalMapper.toCreateData(sesion),
          });
          return;
        }

        if (
          !sesion.tieneErrorConfiguracion ||
          pendiente.estado_sesiones?.estado_actual !== 'ERROR_CONFIGURACION'
        )
          throw new SesionActivaExistenteException();
        await tx.chat_sesiones.update({
          where: { id_sesion: pendiente.id_sesion },
          data: SesionConversacionalMapper.toErrorUpdateData(sesion),
        });
        await tx.estado_sesiones.update({
          where: { id_sesion: pendiente.id_sesion },
          data: { fecha_actualizacion: new Date() },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }
}
