import { randomUUID } from "crypto";

export class ContenidoCronograma {
    constructor(
        readonly id_contenido_cronograma: string,
        readonly id_contenido: string,
        readonly id_unidad_temporal: string,
        readonly orden_contenido: number,
        readonly fecha_inicio_disponibilidad: Date,
        readonly fecha_fin_disponibilidad: Date,
        readonly fecha_creacion: Date,
        readonly fecha_actualizacion: Date,
    ) {}

    static crear(
        idContenido: string,
        idUnidadTemporal: string,
        ordenContenido: number,
        fechaInicioDisponibilidad: Date,
        fechaFinDisponibilidad: Date,
    ): ContenidoCronograma {
        return new ContenidoCronograma(
            randomUUID(),
            idContenido,
            idUnidadTemporal,
            ordenContenido,
            fechaInicioDisponibilidad,
            fechaFinDisponibilidad,
            new Date(),
            new Date(),
        );
    }

    static actualizarAsociacion(
        contenidoCronograma: ContenidoCronograma,
        ordenContenido: number,
        fechaInicioDisponibilidad: Date,
        fechaFinDisponibilidad: Date,
    ): ContenidoCronograma {
        return new ContenidoCronograma(
            contenidoCronograma.id_contenido_cronograma,
            contenidoCronograma.id_contenido,
            contenidoCronograma.id_unidad_temporal,
            ordenContenido,
            fechaInicioDisponibilidad,
            fechaFinDisponibilidad,
            contenidoCronograma.fecha_creacion,
            new Date(),
        );
    }
}