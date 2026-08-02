import { IsString } from "class-validator";

export class ActualizacionContrasenaDtoRequest {

    @IsString()
    nuevaContrasena!:string;

    codigo!:string;
}