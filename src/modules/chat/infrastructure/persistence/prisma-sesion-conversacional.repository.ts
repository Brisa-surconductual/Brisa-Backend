import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { SesionConversacional } from '../../domain/entities/sesion/sesion-conversacional.entity';
import { SesionActivaExistenteException } from '../../domain/exceptions';
import { SesionConversacionalRepository } from '../../domain/repositories/sesion-conversacional.repository';
import { SesionConversacionalMapper } from '../mappers/sesion-conversacional.mapper';

@Injectable()
export class PrismaSesionConversacionalRepository implements SesionConversacionalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarUltimaReanudable(
    idUsuario: string,
  ): Promise<SesionConversacional | null> {
    const sesion = await this.prisma.chat_sesiones.findFirst({
      where: {
        id_usuario: idUsuario,
        estado_sesiones: {
          is: {
            estado_actual: { in: ['ACTIVA', 'PAUSADA'] },
          },
        },
      },
      include: { estado_sesiones: true },
      orderBy: [
        { fecha_ultima_interaccion: 'desc' },
        { fecha_inicio: 'desc' },
        { id_sesion: 'desc' },
      ],
    });

    if (sesion === null || sesion.estado_sesiones === null) {
      return null;
    }

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
          await this.actualizar(tx, sesion, existente.estado_sesiones);
          return;
        }

        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${sesion.idUsuario}))`;

        if (sesion.tieneErrorConfiguracion) {
          await this.registrarErrorConfiguracion(tx, sesion);
          return;
        }

        const activa = await tx.chat_sesiones.findFirst({
          where: {
            id_usuario: sesion.idUsuario,
            estado_sesiones: {
              is: { estado_actual: { in: ['ACTIVA', 'PAUSADA'] } },
            },
          },
          select: { id_sesion: true },
        });

        if (activa !== null) {
          throw new SesionActivaExistenteException();
        }

        await tx.chat_sesiones.create({
          data: SesionConversacionalMapper.toCreateData(sesion),
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }

  /** Reutiliza la sesión con error del usuario; si no existe, crea una. */
  private async registrarErrorConfiguracion(
    tx: Prisma.TransactionClient,
    sesion: SesionConversacional,
  ): Promise<void> {
    const previa = await tx.chat_sesiones.findFirst({
      where: {
        id_usuario: sesion.idUsuario,
        estado_sesiones: { is: { estado_actual: 'ERROR_CONFIGURACION' } },
      },
      select: { id_sesion: true },
    });

    if (previa === null) {
      await tx.chat_sesiones.create({
        data: SesionConversacionalMapper.toCreateData(sesion),
      });
      return;
    }

    await tx.chat_sesiones.update({
      where: { id_sesion: previa.id_sesion },
      data: SesionConversacionalMapper.toErrorUpdateData(sesion),
    });
    await tx.estado_sesiones.update({
      where: { id_sesion: previa.id_sesion },
      data: { fecha_actualizacion: new Date() },
    });
  }

  private async actualizar(
    tx: Prisma.TransactionClient,
    sesion: SesionConversacional,
    estadoPrevio: { estado_actual: string } | null,
  ): Promise<void> {
    const ahora = new Date();
    const reanudada =
      estadoPrevio?.estado_actual === 'PAUSADA' &&
      sesion.estadoActual === 'ACTIVA';

    await tx.chat_sesiones.update({
      where: { id_sesion: sesion.idSesion },
      data: SesionConversacionalMapper.toProgressUpdateData(sesion),
    });

    await tx.estado_sesiones.update({
      where: { id_sesion: sesion.idSesion },
      data: {
        estado_actual: sesion.estadoActual,
        fecha_actualizacion: ahora,
        ...(reanudada && { fecha_reanudacion: ahora }),
      },
    });
  }
}
