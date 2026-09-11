import { IsBoolean, IsDate, IsOptional, IsString } from "class-validator";
import { Contenido } from "../../../domain/entities/contenido.entity";
import { ContenidoCronograma } from "../../../domain/entities/contenido-cronograma.entity";

export class ContenidosExitentesDtoResponse {

    @IsString()
    idContenido!: string;
    
    @IsString()
    @IsOptional()
    idAsociasionUnidadTemporalContenido!: string | null;

    @IsBoolean()
    asociado!: boolean;

    @IsString()
    nombre!: string;
    @IsDate()
    fechaCreacionContenido!: Date;

    static fromEntity(
        entity: Contenido,
        asociacion: ContenidoCronograma | null,
    ): ContenidosExitentesDtoResponse {
        const dto = new ContenidosExitentesDtoResponse();
        dto.idContenido = entity.id_contenido;
        dto.idAsociasionUnidadTemporalContenido =
            asociacion?.id_contenido_cronograma ?? null;
        dto.asociado = asociacion !== null;
        dto.nombre = entity.nombre_contenido;
        dto.fechaCreacionContenido = entity.fecha_creacion;
        return dto;
    }
}