import { IsString } from "class-validator";


export class EliminarAsociacionContenidoUnidadTemporalDtoResponse {
    @IsString()
    mensaje!: string;

    static crear(): EliminarAsociacionContenidoUnidadTemporalDtoResponse {
        const dto = new EliminarAsociacionContenidoUnidadTemporalDtoResponse();
        dto.mensaje = "Asociación eliminada exitosamente, el contenido ya no estará asociado a la unidad temporal.";
        return dto;
    }
}