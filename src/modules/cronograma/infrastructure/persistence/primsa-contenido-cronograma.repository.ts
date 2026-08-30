import { Injectable } from "@nestjs/common";
import { ContenidoCronogramaRepository } from "../../domain/repositories/contenido-cronograma.repository";
import {PrismaService} from "prisma/prisma.service";
import { ContenidoCronograma } from "../../domain/entities/contenido-cronograma.entity";
import { ContenidoCronogramaMapper } from "../mappers/contenido-cronograma.mapper";

@Injectable()
export class PrismaContenidoCronogramaRepository implements ContenidoCronogramaRepository {
    constructor(
        private readonly prisma: PrismaService,
    ) {}
    
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
        }
        );
    }

    async crear(contenidoCronograma: ContenidoCronograma): Promise<ContenidoCronograma> {
        await this.prisma.$transaction(async (tx) => {
            await tx.contenidos_cronograma.create({
                data: ContenidoCronogramaMapper.toPrisma(contenidoCronograma) as any, 
            })
        })
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