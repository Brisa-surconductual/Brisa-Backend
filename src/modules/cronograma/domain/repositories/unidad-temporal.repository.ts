import {UnidadTemporal} from "../entities/unidad-temporal.entity";

export abstract class UnidadTemporalRepository {
    abstract crearUnidadTemporal(unidadTemporal: UnidadTemporal): Promise<UnidadTemporal>;
    abstract obtenerPorCronograma(id_cronograma: string): Promise<UnidadTemporal[]>;

}