import { SolapamientoUnidadTemporalException } from "../../domain/exeption/solapamiento-unidad-temporal.exeption";

type FechaRango = {
  fecha_inicio?: Date;
  fecha_fin?: Date;
  fechaInicio?: Date;
  fechaFin?: Date;
  fecha_inicio_disponibilidad?: Date;
  fecha_fin_disponibilidad?: Date;
};

export class ValidarSolapamientoTemporalService {
  public validarSolapamiento<T extends FechaRango>(
    elementosExistentes: T[],
    fechaInicioNueva: Date,
    fechaFinNueva: Date,
  ): void {
    for (const elementoExistente of elementosExistentes) {
      const fechaInicioExistente =
        elementoExistente.fecha_inicio ??
        elementoExistente.fechaInicio ??
        elementoExistente.fecha_inicio_disponibilidad;

      const fechaFinExistente =
        elementoExistente.fecha_fin ??
        elementoExistente.fechaFin ??
        elementoExistente.fecha_fin_disponibilidad;

      if (!fechaInicioExistente || !fechaFinExistente) {
        continue;
      }

      const seSolapan =
        fechaInicioNueva <= fechaFinExistente &&
        fechaFinNueva >= fechaInicioExistente;

      if (seSolapan) {
        throw new SolapamientoUnidadTemporalException();
      }
    }
  }
}