import {UnidadTemporal} from "../../domain/entities/unidad-temporal.entity";


export class UnidadesTemporalesMapper {
    static toDomain(unidadTemporal: {
        id_unidad_temporal: string;
        id_cronograma: string;
        nombre_unidad: string;
        orden_unidad: number;
        fecha_inicio: Date;
        fecha_fin: Date;
        utilizada_por_usuario: boolean;
        fecha_creacion: Date;
        fecha_actualizacion: Date;
    }): UnidadTemporal {
        return new UnidadTemporal(
            unidadTemporal.id_unidad_temporal,
            unidadTemporal.id_cronograma,
            unidadTemporal.nombre_unidad,
            unidadTemporal.orden_unidad,
            unidadTemporal.fecha_inicio,
            unidadTemporal.fecha_fin,
            unidadTemporal.utilizada_por_usuario,
            unidadTemporal.fecha_creacion,
            unidadTemporal.fecha_actualizacion
        );
    }

    static toPrisma(unidadTemporal: UnidadTemporal) {
        return{
            id_unidad_temporal: unidadTemporal.id_unidad_Temporal,
            id_cronograma: unidadTemporal.id_cronograma,
            nombre_unidad: unidadTemporal.nombre,
            orden_unidad: unidadTemporal.orden_unidad,
            fecha_inicio: unidadTemporal.fecha_inicio,
            fecha_fin: unidadTemporal.fecha_fin,
            utilizada_por_usuarios: unidadTemporal.utilizada_por_usuario,
            fecha_creacion: unidadTemporal.fecha_creacion,
            fecha_actualizacion: unidadTemporal.fecha_actualizacion
        }
    }
}