import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { TipoContenido } from '../../domain/enums/tipo-contenido.enum';

function trimString({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class ActualizarContenidoDtoRequest {
  @ValidateIf((_, value: unknown) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre_contenido?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsEnum(TipoContenido)
  tipo_contenido?: TipoContenido;
}
