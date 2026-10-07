import { IsString } from "class-validator";

export class EliminarUnidadTemporalDtoResponse {
    
    @IsString()
    mensaje!: string
   
    static crear(): EliminarUnidadTemporalDtoResponse {
        const response = new EliminarUnidadTemporalDtoResponse();
        response.mensaje = "Unidad temporal eliminada con exito";
        return response;
    }

}