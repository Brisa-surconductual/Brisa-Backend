import { randomUUID } from "crypto";
import {contenidoCronogramadoEstadoInavilitadoParaEliminacionException} from "../exeption/contenido-cronograma/contenido-cronogramado-estado-inavilitado.exeption";

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

    obtenerEstado(fechaReferencia: Date = new Date()): 'PROGRAMADO' | 'ACTIVO' | 'FINALIZADO' {
        if (!this.fecha_inicio_disponibilidad || !this.fecha_fin_disponibilidad) {
            return 'PROGRAMADO';
        }

        if (fechaReferencia < this.fecha_inicio_disponibilidad) {
            return 'PROGRAMADO';
        } else if (fechaReferencia >= this.fecha_inicio_disponibilidad && fechaReferencia < this.fecha_fin_disponibilidad) {
            return 'ACTIVO';
        } else {
            return 'FINALIZADO';
        }
    }

    validarEliminacion(fechaReferencia: Date = new Date()): void {
        const estado = this.obtenerEstado(fechaReferencia);
        
        if (estado !== 'PROGRAMADO') {
            throw new contenidoCronogramadoEstadoInavilitadoParaEliminacionException(estado);
        }
    }
}