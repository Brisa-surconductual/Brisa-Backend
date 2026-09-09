import { AsignacionOrdenUnidad } from "../../application/service/reordenar-unidad-temporal.service";
import {UnidadTemporal} from "../entities/unidad-temporal.entity";

export abstract class UnidadTemporalRepository {
    abstract crearUnidadTemporal(unidadTemporal: UnidadTemporal): Promise<UnidadTemporal>;
    abstract obtenerPorCronograma(id_cronograma: string): Promise<UnidadTemporal[]>;
    abstract obtnerIdCronogramaPorIdUnidadTemporal(id_unidad_temporal: string): Promise<string>;
    abstract obtenerPorIdUnidadTemporal(id_unidad_temporal: string): Promise<UnidadTemporal | null>;
    abstract actualizarUnidadTemporal(unidadTemporal: UnidadTemporal): Promise<UnidadTemporal>;
    abstract actualizarConReordenamiento( unidadActualizada: UnidadTemporal, reordenamientoHermanas: AsignacionOrdenUnidad[], ): Promise<UnidadTemporal>;
    abstract eliminarConReordenamiento( idUnidadTemporal: string, reordenamientoHermanas: AsignacionOrdenUnidad[], ): Promise<void>;
}