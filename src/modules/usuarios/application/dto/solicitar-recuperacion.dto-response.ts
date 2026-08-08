 import { IsDate, IsEmail, IsString } from 'class-validator';
 import {EstadoCodigo} from "../../domain/enums/estado-codigo-enum";

export class SolicitarRecuperacionDtoResponse {

    mensaje!: string;

    static crear(): SolicitarRecuperacionDtoResponse {
        const dto = new SolicitarRecuperacionDtoResponse();
        dto.mensaje = "Recibirás un código de recuperación al correo";
        return dto;
    }
}