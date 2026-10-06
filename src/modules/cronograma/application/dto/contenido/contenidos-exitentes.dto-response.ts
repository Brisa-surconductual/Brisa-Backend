import { IsBoolean, IsDate, IsEnum, IsOptional, IsString } from "class-validator";
import { Contenido } from "../../../domain/entities/contenido.entity";
import { ContenidoCronograma } from "../../../domain/entities/contenido-cronograma.entity";
import { TipoContenido } from "../../../domain/enums/tipo-contenido.enum";

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

    @IsEnum(TipoContenido)
    tipoContenido!: TipoContenido;

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
        dto.tipoContenido = entity.tipo_contenido;
        dto.fechaCreacionContenido = entity.fecha_creacion;
        return dto;
    }
}