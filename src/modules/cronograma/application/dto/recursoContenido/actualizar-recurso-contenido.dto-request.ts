import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

const proporcionado = (_: unknown, valor: unknown): boolean =>
  valor !== undefined;

export class ActualizarRecursoContenidoDtoRequest {
  @ValidateIf(proporcionado)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  texto_contenido?: string;

  @ValidateIf(proporcionado)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  id_modulos?: string[];

  @ValidateIf((_, valor: unknown) => valor !== undefined && valor !== null)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  texto_alternativo?: string | null;

  @ValidateIf((_, valor: unknown) => valor !== undefined && valor !== null)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  duracion_segundos?: number | null;

  @ValidateIf(proporcionado)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(1024)
  clave_almacenamiento?: string;

  @ValidateIf(proporcionado)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  mime_type?: string;

  @ValidateIf(proporcionado)
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  tamano_bytes?: number;
}
