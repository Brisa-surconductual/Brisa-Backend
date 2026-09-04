import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { TipoRecurso } from '../../domain/enums/tipo-recurso.enum';

function trimString({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class SolicitarUrlSubidaRecursoDtoRequest {
  @IsUUID()
  id_contenido!: string;

  @IsEnum(TipoRecurso)
  tipo_recurso!: TipoRecurso;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  mime_type!: string;

  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  tamano_bytes!: number;
}
