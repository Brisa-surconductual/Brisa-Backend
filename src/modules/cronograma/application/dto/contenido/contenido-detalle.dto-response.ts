import { IsArray, IsString } from "class-validator";
import { RecursoDtoResponse } from "../recursoContenido/recurso.dto-response";

export class ContenidoDetalleResponseDto {
    @IsString()
    idContenido!: string;

    @IsString()
    nombreContenido!: string;

    @IsString()
    tipo!: string;

    @IsString()
    @IsArray()
    recursos!: RecursoDtoResponse[];
}