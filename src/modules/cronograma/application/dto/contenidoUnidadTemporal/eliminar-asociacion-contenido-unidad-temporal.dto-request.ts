import { IsString } from "class-validator";

export class EliminarAsociacionContenidoUnidadTemporalDtoRequest {
    @IsString()
    id_contenido_cronograma!: string;

}