import { IsString } from "class-validator";



export class CreacionUsuarioAdminDtoResponse {

    @IsString   ()
    mensaje!: string;

    static crear(): CreacionUsuarioAdminDtoResponse {
        const dto = new CreacionUsuarioAdminDtoResponse();
        dto.mensaje = "Usuario admin creado correctamente.";
        return dto;
    }
}