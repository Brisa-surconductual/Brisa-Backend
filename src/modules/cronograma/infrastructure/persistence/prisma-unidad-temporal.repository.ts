import {Injectable} from "@nestjs/common";
import {UnidadTemporalRepository} from "../../domain/repositories/unidad-temporal.repository";
import {UnidadTemporal} from "../../domain/entities/unidad-temporal.entity";
import { PrismaService } from "prisma/prisma.service";
import {UnidadesTemporalesMapper} from "../mappers/unidades-temporales.mapper";
import { AsignacionOrdenUnidad } from "../../application/service/reordenar-unidad-temporal.service";

@Injectable()
export class PrismaUnidadTemporalRepository implements UnidadTemporalRepository {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    async actualizarUnidadTemporal(unidadTemporal: UnidadTemporal): Promise<UnidadTemporal> {
    await this.prisma.unidades_temporales.update({
        where: { id_unidad_temporal: unidadTemporal.id_unidad_Temporal },
        data: {
            nombre_unidad: String(unidadTemporal.nombre),
            orden_unidad: unidadTemporal.orden_unidad,
            fecha_inicio: unidadTemporal.fecha_inicio,
            fecha_fin: unidadTemporal.fecha_fin,
            fecha_actualizacion: unidadTemporal.fecha_actualizacion,
        },
    });

    return unidadTemporal;
}

    obtenerPorIdUnidadTemporal(id_unidad_temporal: string): Promise<UnidadTemporal | null> {
        return this.prisma.unidades_temporales.findUnique({
            where: { id_unidad_temporal },
        }).then(unidad => {
            if (!unidad) {
                throw new Error(`Unidad temporal con id ${id_unidad_temporal} no encontrada`);
            }
            return UnidadesTemporalesMapper.toDomain({
                ...unidad,
                utilizada_por_usuario: unidad.utilizada_por_usuarios,
            });
        }
        );
    }
    
    obtnerIdCronogramaPorIdUnidadTemporal(id_unidad_temporal: string): Promise<string> {
        return this.prisma.unidades_temporales.findUnique({
            where: { id_unidad_temporal },
            select: { id_cronograma: true },
        }).then(result => {
            if (!result) {
                throw new Error(`Unidad temporal con id ${id_unidad_temporal} no encontrada`);
            }  
            return result.id_cronograma;
        });
    }
    
    async crearUnidadTemporal(unidadTemporal: UnidadTemporal): Promise<UnidadTemporal> {
        await this.prisma.$transaction(async (tx) => {
            await tx.unidades_temporales.create({
                data: UnidadesTemporalesMapper.toPrisma(unidadTemporal) as any,
            });
        });

        return unidadTemporal;
    }

    obtenerPorCronograma(id_cronograma: string): Promise<UnidadTemporal[]> {
        return this.prisma.unidades_temporales.findMany({
            where: { id_cronograma },
        }).then(unidades => unidades.map(unidad => UnidadesTemporalesMapper.toDomain({
            ...unidad,
            utilizada_por_usuario: unidad.utilizada_por_usuarios,
        })));
    
    }

    async actualizarConReordenamiento(  unidadActualizada: UnidadTemporal, reordenamientoHermanas: AsignacionOrdenUnidad[], ): Promise<UnidadTemporal> {
    await this.prisma.$transaction(async (tx) => {
        // Fase 1: mover TODAS (hermanas + la editada) a órdenes negativos
        await tx.unidades_temporales.update({
            where: { id_unidad_temporal: unidadActualizada.id_unidad_Temporal },
            data: { orden_unidad: -unidadActualizada.orden_unidad },
        });

        for (const asignacion of reordenamientoHermanas) {
            await tx.unidades_temporales.update({
                where: { id_unidad_temporal: asignacion.id_unidad_temporal },
                data: { orden_unidad: -asignacion.orden_unidad },
            });
        }

        // Fase 2: asignar valores finales positivos, incluyendo nombre/fechas de la editada
        await tx.unidades_temporales.update({
            where: { id_unidad_temporal: unidadActualizada.id_unidad_Temporal },
            data: {
                nombre_unidad: String(unidadActualizada.nombre),
                orden_unidad: unidadActualizada.orden_unidad,
                fecha_inicio: unidadActualizada.fecha_inicio,
                fecha_fin: unidadActualizada.fecha_fin,
                fecha_actualizacion: unidadActualizada.fecha_actualizacion,
            },
        });

        for (const asignacion of reordenamientoHermanas) {
            await tx.unidades_temporales.update({
                where: { id_unidad_temporal: asignacion.id_unidad_temporal },
                data: { orden_unidad: asignacion.orden_unidad },
            });
        }
    });

    return unidadActualizada;
}
    
}