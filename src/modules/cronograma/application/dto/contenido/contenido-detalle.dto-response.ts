import { IsArray, IsDate, IsNumber, IsString } from "class-validator";
import { RecursoDtoResponse } from "../recursoContenido/recurso.dto-response";

export class ContenidoDetalleResponseDto {
    @IsString()
    idContenido!: string;

    @IsString()
    idContenidoCronograma!: string;

    @IsNumber()
    ordenContenido!: number;

    @IsDate()
    fechaInicioDisponibilidad!: Date;

    @IsDate()
    fechaFinDisponibilidad!: Date;

    @IsString()
    nombreContenido!: string;

    @IsString()
    tipo!: string;

    @IsString()
    @IsArray()
    recursos!: RecursoDtoResponse[];
}