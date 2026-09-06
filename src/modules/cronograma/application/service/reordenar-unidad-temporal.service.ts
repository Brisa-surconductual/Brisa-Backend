import { Injectable } from '@nestjs/common';
import { UnidadTemporal } from '../../domain/entities/unidad-temporal.entity';

export interface AsignacionOrdenUnidad {
  id_unidad_temporal: string;
  orden_unidad: number;
}

@Injectable()
export class ReordenarUnidadTemporalService {
  public recalcularOrden(unidades: UnidadTemporal[]): AsignacionOrdenUnidad[] {
    const ordenadas = [...unidades].sort(
      (a, b) => a.fecha_inicio.getTime() - b.fecha_inicio.getTime(),
    );

    return ordenadas.map((unidad, index) => ({
      id_unidad_temporal: unidad.id_unidad_Temporal,
      orden_unidad: index + 1,
    }));
  }
}