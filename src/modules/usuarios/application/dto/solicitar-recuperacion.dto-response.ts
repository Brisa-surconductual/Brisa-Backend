 import { IsDate, IsEmail, IsString } from 'class-validator';
 import {EstadoCodigo} from "../../domain/enums/estado-codigo-enum";

export class SolicitarRecuperacionDtoResponse {

    mensaje!: string;

    static crear(): SolicitarRecuperacionDtoResponse {
        const dto = new SolicitarRecuperacionDtoResponse();
        dto.mensaje = "Si el correo está registrado, recibirás un código de recuperación.";
        return dto;
    }
}