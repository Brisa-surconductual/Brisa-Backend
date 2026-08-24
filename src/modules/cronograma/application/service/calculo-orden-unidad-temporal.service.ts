import { UnidadTemporal } from "../../domain/entities/unidad-temporal.entity";

export class CalculoOrdenUnidadTemporalService {

    public calcularSiguienteOrden(unidadesExistentes: UnidadTemporal[]): number {
        if (unidadesExistentes.length === 0) {
          return 1;
        }
    
        const ordenMaximo = Math.max(
          ...unidadesExistentes.map((unidad) => unidad.orden_unidad),
        );
    
        return ordenMaximo + 1;
      }
    
}