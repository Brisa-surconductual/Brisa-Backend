import { IsEnum, IsString } from "class-validator";
import {ContenidoDetalleResponseDto} from "../contenido/contenido-detalle.dto-response";
import { EstadoContenido } from "../../../domain/enums/estado-contenido.enum";
import {EstadoCronograma} from "../../../domain/enums/estado-cronograma.enum";


export class ObtenerContenidosUnidadDtoResponse {
    @IsString()
    cronogramaId!: string;

    @IsString()
    unidadTemporalId!: string;

    @IsString()
    @IsEnum(EstadoCronograma)
    estadoCronograma!: string;

    @IsString()
    @IsEnum(EstadoContenido)
    estadoUnidadTemporal!: string;

    @IsString()
    contenidos!: ContenidoDetalleResponseDto[];



    constructor(data: Partial<ObtenerContenidosUnidadDtoResponse>) {
        Object.assign(this, data);
    }
}
