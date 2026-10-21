import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ContenidoCronogramaRepository } from '../../domain/repositories/contenido-cronograma.repository';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { ContenidoCronograma } from '../../domain/entities/contenido-cronograma.entity';
import { ContenidoCronogramaMapper } from '../mappers/contenido-cronograma.mapper';
import { AsignacionOrden } from '../../application/service/reordenar-contenido-temporal.service';

@Injectable()
export class PrismaContenidoCronogramaRepository implements ContenidoCronogramaRepository {
  constructor(private readonly prisma: PrismaService) {}
  async obtenerContenidosConRecursosPorUnidadTemporal(
    id_unidad_temporal: string,
  ): Promise<any[]> {
    const relaciones = await this.prisma.contenidos_cronograma.findMany({
      where: { id_unidad_temporal },
      orderBy: { orden_contenido: 'asc' }, // Ordenamos por el campo de la tabla intermedia
      include: {
        // Unimos con la tabla contenido
        contenidos: {
          include: {
            // Unimos con la tabla recursos_contenido
            recursos_contenido: true,
          },
        },
      },
    });

    return relaciones;
  }

  async existeContenidoParaUnidadTemporal(
    id_unidad_temporal: string,
  ): Promise<boolean> {
    return this.prisma.contenidos_cronograma
      .count({
        where: { id_unidad_temporal },
      })
      .then((count) => count > 0);
  }

  async eliminar(id_contenido_cronograma: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.asegurarAsociacionEditable(tx, id_contenido_cronograma);
      await tx.contenidos_cronograma.deleteMany({
        where: { id_contenido_cronograma },
      });
    });
  }

  async crearConReordenamiento(
    contenidoCronograma: ContenidoCronograma,
    reordenamientoHermanas: AsignacionOrden[],
  ): Promise<ContenidoCronograma> {
    await this.prisma.$transaction(async (tx) => {
      await this.asegurarUnidadEditable(
        tx,
        contenidoCronograma.id_unidad_temporal,
      );
      for (const asignacion of reordenamientoHermanas) {
        await tx.contenidos_cronograma.update({
          where: {
            id_contenido_cronograma: asignacion.id_contenido_cronograma,
          },
          data: { orden_contenido: -asignacion.orden_contenido },
        });
      }

      await tx.contenidos_cronograma.create({
        data: ContenidoCronogramaMapper.toPrisma(contenidoCronograma),
      });

      for (const asignacion of reordenamientoHermanas) {
        await tx.contenidos_cronograma.update({
          where: {
            id_contenido_cronograma: asignacion.id_contenido_cronograma,
          },
          data: { orden_contenido: asignacion.orden_contenido },
        });
      }
    });

    return contenidoCronograma;
  }

  obtenerPorIdContenido(
    id_contenido: string,
  ): Promise<ContenidoCronograma | null> {
    return this.prisma.contenidos_cronograma
      .findUnique({
        where: { id_contenido },
      })
      .then((contenido) => {
        if (!contenido) {
          return null;
        }
        return ContenidoCronogramaMapper.toDomain({
          ...contenido,
          orden_contenido: contenido.orden_contenido ?? 0,
          fecha_inicio_disponibilidad:
            contenido.fecha_inicio_disponibilidad ?? new Date(),
          fecha_fin_disponibilidad:
            contenido.fecha_fin_disponibilidad ?? new Date(),
        });
      });
  }

  obtenerPorIdContenidoCronograma(
    id_contenido_cronograma: string,
  ): Promise<ContenidoCronograma | null> {
    return this.prisma.contenidos_cronograma
      .findUnique({
        where: { id_contenido_cronograma },
      })
      .then((contenido) => {
        if (!contenido) {
          return null;
        }
        return ContenidoCronogramaMapper.toDomain({
          ...contenido,
          orden_contenido: contenido.orden_contenido ?? 0,
          fecha_inicio_disponibilidad:
            contenido.fecha_inicio_disponibilidad ?? new Date(),
          fecha_fin_disponibilidad:
            contenido.fecha_fin_disponibilidad ?? new Date(),
        });
      });
  }

  async actualizarDisponibilidad(
    id_contenido_cronograma: string,
    fecha_inicio_disponibilidad: Date,
    fecha_fin_disponibilidad: Date,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.asegurarAsociacionEditable(tx, id_contenido_cronograma);
      await tx.contenidos_cronograma.update({
        where: { id_contenido_cronograma },
        data: {
          fecha_inicio_disponibilidad,
          fecha_fin_disponibilidad,
          fecha_actualizacion: new Date(),
        },
      });
    });
  }

  async actualizarOrdenMasivo(asignaciones: AsignacionOrden[]): Promise<void> {
    if (asignaciones.length === 0) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      for (const asignacion of asignaciones)
        await this.asegurarAsociacionEditable(
          tx,
          asignacion.id_contenido_cronograma,
        );
      for (const asignacion of asignaciones) {
        await tx.contenidos_cronograma.update({
          where: {
            id_contenido_cronograma: asignacion.id_contenido_cronograma,
          },
          data: { orden_contenido: -asignacion.orden_contenido },
        });
      }

      for (const asignacion of asignaciones) {
        await tx.contenidos_cronograma.update({
          where: {
            id_contenido_cronograma: asignacion.id_contenido_cronograma,
          },
          data: { orden_contenido: asignacion.orden_contenido },
        });
      }
    });
  }

  async crear(
    contenidoCronograma: ContenidoCronograma,
  ): Promise<ContenidoCronograma> {
    await this.prisma.$transaction(async (tx) => {
      await this.asegurarUnidadEditable(
        tx,
        contenidoCronograma.id_unidad_temporal,
      );
      await tx.contenidos_cronograma.create({
        data: ContenidoCronogramaMapper.toPrisma(contenidoCronograma),
      });
    });
    return contenidoCronograma;
  }

  obtnerPorIdUnidadTemporal(
    id_unidad_temporal: string,
  ): Promise<ContenidoCronograma[]> {
    return this.prisma.contenidos_cronograma
      .findMany({
        where: { id_unidad_temporal },
      })
      .then((contenidos) =>
        contenidos.map((contenido) =>
          ContenidoCronogramaMapper.toDomain({
            ...contenido,
            orden_contenido: contenido.orden_contenido ?? 0,
            fecha_inicio_disponibilidad:
              contenido.fecha_inicio_disponibilidad ?? new Date(),
            fecha_fin_disponibilidad:
              contenido.fecha_fin_disponibilidad ?? new Date(),
          }),
        ),
      );
  }

  private async asegurarUnidadEditable(
    tx: Prisma.TransactionClient,
    idUnidad: string,
  ): Promise<void> {
    const estados = await tx.$queryRaw<{ estado: string }[]>(Prisma.sql`
        SELECT c.estado FROM cronograma.cronogramas c
        JOIN cronograma.unidades_temporales u ON u.id_cronograma = c.id_cronograma
        WHERE u.id_unidad_temporal = ${idUnidad}::uuid FOR UPDATE OF c
      `);
    if (!estados.length)
      throw new NotFoundException('La unidad temporal no existe.');
    if (estados[0].estado !== 'INACTIVO')
      throw new ConflictException(
        'El cronograma está activo. Su contenido y programación son de solo lectura.',
      );
  }

  private async asegurarAsociacionEditable(
    tx: Prisma.TransactionClient,
    idAsociacion: string,
  ): Promise<void> {
    const asociacion = await tx.contenidos_cronograma.findUnique({
      where: { id_contenido_cronograma: idAsociacion },
      select: { id_unidad_temporal: true },
    });
    if (asociacion)
      await this.asegurarUnidadEditable(tx, asociacion.id_unidad_temporal);
  }
}
