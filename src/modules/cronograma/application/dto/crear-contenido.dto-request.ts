import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { TipoContenido } from '../../domain/enums/tipo-contenido.enum';

function trimString({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CrearContenidoDtoRequest {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre_contenido!: string;

  @IsEnum(TipoContenido)
  tipo_contenido!: TipoContenido;
}
