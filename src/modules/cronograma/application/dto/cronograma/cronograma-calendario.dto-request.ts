import { IsArray, IsString } from "class-validator";

export class CronogramaCalendarioDtoRequest {

    @IsString()
    idCronograma!: string;

    @IsString()
    idUnidadTemporal!: string;

}