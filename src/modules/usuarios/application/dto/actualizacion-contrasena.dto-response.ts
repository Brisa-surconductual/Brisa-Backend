import { IsString } from "class-validator";

export class ActualizacionContrasenaDtoResponse {
    
    mensaje!: string;

    static crear(): ActualizacionContrasenaDtoResponse {
        const dto = new ActualizacionContrasenaDtoResponse();
        dto.mensaje = "Contraseña actualizada correctamente.";
        return dto;
    }
}