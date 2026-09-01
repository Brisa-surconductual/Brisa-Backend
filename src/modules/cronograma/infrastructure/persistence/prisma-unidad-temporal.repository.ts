import {Injectable} from "@nestjs/common";
import {UnidadTemporalRepository} from "../../domain/repositories/unidad-temporal.repository";
import {UnidadTemporal} from "../../domain/entities/unidad-temporal.entity";
import { PrismaService } from "prisma/prisma.service";
import {UnidadesTemporalesMapper} from "../mappers/unidades-temporales.mapper";

@Injectable()
export class PrismaUnidadTemporalRepository implements UnidadTemporalRepository {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    obtenerPorIdUnidadTemporal(id_unidad_temporal: string): Promise<UnidadTemporal> {
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
    
}