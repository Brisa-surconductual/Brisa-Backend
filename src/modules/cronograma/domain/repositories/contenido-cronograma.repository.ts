import {ContenidoCronograma} from "../entities/contenido-cronograma.entity";

export abstract class ContenidoCronogramaRepository{

    abstract crear(contenidoCronograma: ContenidoCronograma): Promise<ContenidoCronograma>;
    abstract obtnerPorIdUnidadTemporal(id_unidad_temporal: string): Promise<ContenidoCronograma[]>;
    abstract obtenerPorIdContenido(id_contenido: string): Promise<ContenidoCronograma | null>;
    
}