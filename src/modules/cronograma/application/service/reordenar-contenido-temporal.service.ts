import { Injectable } from '@nestjs/common';
import { ContenidoCronograma } from '../../domain/entities/contenido-cronograma.entity';

export interface AsignacionOrden {
  id_contenido_cronograma: string;
  orden_contenido: number;
}

@Injectable()
export class ReordenarContenidoTemporalService {
    
  public recalcularOrden(asociaciones: ContenidoCronograma[]): AsignacionOrden[] {
    const ordenadas = [...asociaciones].sort(
      (a, b) =>
        a.fecha_inicio_disponibilidad.getTime() -
        b.fecha_inicio_disponibilidad.getTime(),
    );

    return ordenadas.map((asociacion, index) => ({
      id_contenido_cronograma: asociacion.id_contenido_cronograma,
      orden_contenido: index + 1,
    }));
  }
}