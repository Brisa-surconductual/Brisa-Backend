import { UnidadTemporal } from "../../domain/entities/unidad-temporal.entity";
import { SolapamientoUnidadTemporalException } from "../../domain/exeption/solapamiento-unidad-temporal.exeption";

export class ValidarSolapamientoUnidadTemporalService {
  public validarSolapamiento(
    unidadesExistentes: UnidadTemporal[],
    fechaInicioNueva: Date,
    fechaFinNueva: Date,
  ): void {
    for (const unidadExistente of unidadesExistentes) {
      const seSolapan =
        fechaInicioNueva <= unidadExistente.fecha_fin &&
        fechaFinNueva >= unidadExistente.fecha_inicio;

      if (seSolapan) {
        throw new SolapamientoUnidadTemporalException();
      }
    }
  }
}