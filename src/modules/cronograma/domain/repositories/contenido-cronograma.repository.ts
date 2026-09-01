import { AsignacionOrden } from "../../application/service/reordenar-contenido-temporal.service";
import {ContenidoCronograma} from "../entities/contenido-cronograma.entity";

export abstract class ContenidoCronogramaRepository{

    abstract crear(contenidoCronograma: ContenidoCronograma): Promise<ContenidoCronograma>;
    abstract obtnerPorIdUnidadTemporal(id_unidad_temporal: string): Promise<ContenidoCronograma[]>;
    abstract obtenerPorIdContenido(id_contenido: string): Promise<ContenidoCronograma | null>;
    abstract obtenerPorIdContenidoCronograma(id_contenido_cronograma: string): Promise<ContenidoCronograma | null>;
    abstract actualizarDisponibilidad(
        id_contenido_cronograma: string,
        fecha_inicio_disponibilidad: Date,
        fecha_fin_disponibilidad: Date,
    ): Promise<void>;
    abstract actualizarOrdenMasivo(asignaciones: AsignacionOrden[]): Promise<void>;

     abstract crearConReordenamiento(
        contenidoCronograma: ContenidoCronograma,
        reordenamientoHermanas: AsignacionOrden[],
    ): Promise<ContenidoCronograma>;
}