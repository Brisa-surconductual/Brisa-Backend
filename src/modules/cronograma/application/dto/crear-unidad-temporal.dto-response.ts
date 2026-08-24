import { UnidadTemporal } from "../../domain/entities/unidad-temporal.entity";

export class UnidadTemporalDtoResponse {

    messaje!: string;

    static crear(unidad: UnidadTemporal): UnidadTemporalDtoResponse {
        const dto = new UnidadTemporalDtoResponse();
        dto.messaje = "Unidad temporal creada correctamente.";
        return dto;
    }

}