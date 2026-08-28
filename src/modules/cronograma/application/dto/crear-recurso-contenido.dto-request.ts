import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { TipoRecurso } from '../../domain/enums/tipo-recurso.enum';

function trimString({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CrearRecursoContenidoDtoRequest {
  @IsUUID()
  id_contenido!: string;

  @IsEnum(TipoRecurso)
  tipo_recurso!: TipoRecurso;

  @IsInt()
  @Min(1)
  orden_bloque!: number;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  texto_contenido?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  clave_almacenamiento?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  mime_type?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  tamano_bytes?: number;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsInt()
  @Min(0)
  duracion_segundos?: number;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  texto_alternativo?: string;

  @IsArray()
  @ArrayMinSize(1, {
    message: 'El recurso debe tener al menos un módulo destino asignado.',
  })
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  id_modulos!: string[];
}
