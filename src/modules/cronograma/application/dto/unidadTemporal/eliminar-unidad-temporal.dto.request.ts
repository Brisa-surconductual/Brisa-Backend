import { IsString } from "class-validator";

export class EliminarUnidadTemporalDtoRequest {
    
    @IsString()
    idUnidadTemporal!: string
   

}