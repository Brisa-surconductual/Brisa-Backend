import { IsString, Matches } from "class-validator";

export class ActualizacionContrasenaDtoRequest {

    @IsString()
    nuevaContrasena!:string;

    @IsString()
    @Matches(/^\d{6}$/)
    codigo!:string;
}