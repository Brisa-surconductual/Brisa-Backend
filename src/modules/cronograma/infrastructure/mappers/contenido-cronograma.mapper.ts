import {ContenidoCronograma} from "../../domain/entities/contenido-cronograma.entity";


export class ContenidoCronogramaMapper {
    static toDomain(contenidoCronograma: {
        id_contenido_cronograma: string;
        id_contenido: string;
        id_unidad_temporal: string;
        id_cronograma: string;
        orden_contenido: number;
        fecha_inicio_disponibilidad: Date;
        fecha_fin_disponibilidad: Date;
        fecha_creacion: Date;
        fecha_actualizacion: Date;
    }): ContenidoCronograma {
        return new ContenidoCronograma(
            contenidoCronograma.id_contenido_cronograma,
            contenidoCronograma.id_contenido,
            contenidoCronograma.id_unidad_temporal,
            contenidoCronograma.id_cronograma,
            contenidoCronograma.orden_contenido,
            contenidoCronograma.fecha_inicio_disponibilidad,
            contenidoCronograma.fecha_fin_disponibilidad,
            contenidoCronograma.fecha_creacion,
            contenidoCronograma.fecha_actualizacion
        );
    }

    static toPrisma(contenidoCronograma: ContenidoCronograma) {
        return {
            id_contenido_cronograma: contenidoCronograma.id_contenido_cronograma,
            id_contenido: contenidoCronograma.id_contenido,
            id_unidad_temporal: contenidoCronograma.id_unidad_temporal,
            id_cronograma: contenidoCronograma.id_cronograma,
            orden_contenido: contenidoCronograma.orden_contenido,
            fecha_inicio_disponibilidad: contenidoCronograma.fecha_inicio_disponibilidad,
            fecha_fin_disponibilidad: contenidoCronograma.fecha_fin_disponibilidad,
            fecha_creacion: contenidoCronograma.fecha_creacion,
            fecha_actualizacion: contenidoCronograma.fecha_actualizacion
        }
    }
}