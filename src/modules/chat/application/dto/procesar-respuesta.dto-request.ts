import {
  Allow,
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';

export type EstadoConectividadRespuesta = 'EN_LINEA' | 'SIN_CONEXION';

export class ProcesarRespuestaDtoRequest {
  @IsUUID()
  id_interaccion!: string;

  @IsUUID()
  id_nodo!: string;

  @IsInt()
  @Min(1)
  @Max(2147483647)
  secuencia!: number;

  @IsString()
  tipo_entrada!: string;

  @Allow()
  valor!: unknown;

  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(
    /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,6})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/u,
  )
  timestamp_interaccion!: string;

  @IsIn(['EN_LINEA', 'SIN_CONEXION'])
  estado_conectividad!: EstadoConectividadRespuesta;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  recursos_no_presentados?: string[] | null;
}
