import { IsString } from "class-validator";

export class RecursoDtoResponse {
    
    @IsString()
    idRescurso!: string;

    @IsString()
    claveAlmacenamiento!: string;

}