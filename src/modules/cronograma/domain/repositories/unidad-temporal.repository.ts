import {UnidadTemporal} from "../entities/unidad-temporal.entity";

export abstract class UnidadTemporalRepository {
    abstract crearUnidadTemporal(unidadTemporal: UnidadTemporal): Promise<UnidadTemporal>;
    abstract obtenerPorCronograma(id_cronograma: string): Promise<UnidadTemporal[]>;
    abstract obtnerIdCronogramaPorIdUnidadTemporal(id_unidad_temporal: string): Promise<string>;
    abstract obtenerPorIdUnidadTemporal(id_unidad_temporal: string): Promise<UnidadTemporal>;

}