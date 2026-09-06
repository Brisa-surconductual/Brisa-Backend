import { IsString } from "class-validator";


export class ActualizarUnidadTemporalDtoResponse {
    @IsString()
    idUnidadTemporal!: string;

    static respuesta(idUnidadTemporal: string): ActualizarUnidadTemporalDtoResponse {
        const response = new ActualizarUnidadTemporalDtoResponse();
        response.idUnidadTemporal = "Unidad temporal actualizada con exito: " + idUnidadTemporal;
        return response;
    }

}