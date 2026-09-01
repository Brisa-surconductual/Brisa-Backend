import { Injectable } from "@nestjs/common";
import { ContenidoCronogramaRepository } from "../../domain/repositories/contenido-cronograma.repository";
import { PrismaService } from "prisma/prisma.service";
import { ContenidoCronograma } from "../../domain/entities/contenido-cronograma.entity";
import { ContenidoCronogramaMapper } from "../mappers/contenido-cronograma.mapper";
import { AsignacionOrden } from "../../application/service/reordenar-contenido-temporal.service";

@Injectable()
export class PrismaContenidoCronogramaRepository implements ContenidoCronogramaRepository {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    async crearConReordenamiento(
        contenidoCronograma: ContenidoCronograma,
        reordenamientoHermanas: AsignacionOrden[],
        ): Promise<ContenidoCronograma> {
        await this.prisma.$transaction(async (tx) => {
            // 1. Mover hermanas a órdenes negativos (espacio libre de colisiones)
            for (const asignacion of reordenamientoHermanas) {
                await tx.contenidos_cronograma.update({
                    where: { id_contenido_cronograma: asignacion.id_contenido_cronograma },
                    data: { orden_contenido: -asignacion.orden_contenido },
                });
            }

            // 2. Insertar la nueva asociación con su orden final
            await tx.contenidos_cronograma.create({
                data: ContenidoCronogramaMapper.toPrisma(contenidoCronograma) as any,
            });

            // 3. Devolver las hermanas a sus órdenes finales positivos
            for (const asignacion of reordenamientoHermanas) {
                await tx.contenidos_cronograma.update({
                    where: { id_contenido_cronograma: asignacion.id_contenido_cronograma },
                    data: { orden_contenido: asignacion.orden_contenido },
                });
            }
        });

        return contenidoCronograma;
    }

    obtenerPorIdContenido(id_contenido: string): Promise<ContenidoCronograma | null> {
        return this.prisma.contenidos_cronograma.findUnique({
            where: { id_contenido },
        }).then(contenido => {
            if (!contenido) {
                return null;
            }
            return ContenidoCronogramaMapper.toDomain({
                ...contenido,
                orden_contenido: contenido.orden_contenido ?? 0,
                fecha_inicio_disponibilidad: contenido.fecha_inicio_disponibilidad ?? new Date(),
                fecha_fin_disponibilidad: contenido.fecha_fin_disponibilidad ?? new Date(),
            });
        });
    }

    obtenerPorIdContenidoCronograma(id_contenido_cronograma: string): Promise<ContenidoCronograma | null> {
        return this.prisma.contenidos_cronograma.findUnique({
            where: { id_contenido_cronograma },
        }).then(contenido => {
            if (!contenido) {
                return null;
            }
            return ContenidoCronogramaMapper.toDomain({
                ...contenido,
                orden_contenido: contenido.orden_contenido ?? 0,
                fecha_inicio_disponibilidad: contenido.fecha_inicio_disponibilidad ?? new Date(),
                fecha_fin_disponibilidad: contenido.fecha_fin_disponibilidad ?? new Date(),
            });
        });
    }

    async actualizarDisponibilidad(
        id_contenido_cronograma: string,
        fecha_inicio_disponibilidad: Date,
        fecha_fin_disponibilidad: Date,
    ): Promise<void> {
        await this.prisma.contenidos_cronograma.update({
            where: { id_contenido_cronograma },
            data: {
                fecha_inicio_disponibilidad,
                fecha_fin_disponibilidad,
                fecha_actualizacion: new Date(),
            },
        });
    }

   async actualizarOrdenMasivo(asignaciones: AsignacionOrden[]): Promise<void> {
    if (asignaciones.length === 0) {
        return;
    }

    await this.prisma.$transaction(async (tx) => {
        // Fase 1: mover todas a órdenes negativos (espacio sin colisiones)
        for (const asignacion of asignaciones) {
            await tx.contenidos_cronograma.update({
                where: { id_contenido_cronograma: asignacion.id_contenido_cronograma },
                data: { orden_contenido: -asignacion.orden_contenido },
            });
        }

        // Fase 2: asignar los órdenes finales positivos
        for (const asignacion of asignaciones) {
            await tx.contenidos_cronograma.update({
                where: { id_contenido_cronograma: asignacion.id_contenido_cronograma },
                data: { orden_contenido: asignacion.orden_contenido },
            });
            }
        });
    }

    async crear(contenidoCronograma: ContenidoCronograma): Promise<ContenidoCronograma> {
        await this.prisma.$transaction(async (tx) => {
            await tx.contenidos_cronograma.create({
                data: ContenidoCronogramaMapper.toPrisma(contenidoCronograma) as any,
            });
        });
        return contenidoCronograma;
    }

    obtnerPorIdUnidadTemporal(id_unidad_temporal: string): Promise<ContenidoCronograma[]> {
        return this.prisma.contenidos_cronograma.findMany({
            where: { id_unidad_temporal },
        }).then(contenidos => contenidos.map(contenido => ContenidoCronogramaMapper.toDomain({
            ...contenido,
            orden_contenido: contenido.orden_contenido ?? 0,
            fecha_inicio_disponibilidad: contenido.fecha_inicio_disponibilidad ?? new Date(),
            fecha_fin_disponibilidad: contenido.fecha_fin_disponibilidad ?? new Date(),
        })));
    }
}