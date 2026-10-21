import { Contenido } from '../entities/contenido.entity';

export interface EstadoCatalogoContenido {
  contenido: Contenido;
  idAsociacion: string | null;
  estadoCronograma: string | null;
  cantidadRecursos: number;
  recursosListos: boolean;
}

export abstract class CatalogoContenidoRepository {
  abstract listar(): Promise<EstadoCatalogoContenido[]>;
}
