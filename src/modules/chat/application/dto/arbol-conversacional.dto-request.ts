import { Transform } from 'class-transformer';
import {
  Equals,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';
import { TipoDatoValidacion } from '../../domain/enums/tipo-dato-validacion-enum';

export class CrearNodoConversacionalDtoRequest {
  @IsUUID()
  id_tipo_nodo!: string;

  @IsObject()
  @IsNotEmptyObject()
  contenido!: Record<string, unknown>;

  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsBoolean()
  es_nodo_inicial: boolean = false;

  @IsOptional()
  @IsInt()
  @Min(1)
  orden?: number;

  @IsOptional()
  @IsUUID()
  id_contenido_cronograma?: string;
}

export class ActualizarNodoConversacionalDtoRequest {
  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsUUID()
  id_tipo_nodo?: string;

  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsObject()
  @IsNotEmptyObject()
  contenido?: Record<string, unknown>;

  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsBoolean()
  es_nodo_inicial?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  orden?: number | null;

  @IsOptional()
  @IsUUID()
  id_contenido_cronograma?: string | null;
}

export class ReglaValidacionDtoRequest {
  @IsEnum(TipoDatoValidacion)
  tipo_dato!: TipoDatoValidacion;

  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsBoolean()
  obligatorio: boolean = true;

  @IsOptional()
  @IsNumber()
  valor_min?: number;

  @IsOptional()
  @IsNumber()
  valor_max?: number;

  @IsOptional()
  @IsString()
  formato_regex?: string;

  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsArray()
  @IsString({ each: true })
  valores_permitidos: string[] = [];

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  mensaje_error!: string;
}

export class CrearFlujoGrupalDtoRequest {
  /** Esta solicitud solo crea flujos grupales. */
  @Equals(ModalidadConversacional.GRUPAL)
  modalidad: ModalidadConversacional.GRUPAL = ModalidadConversacional.GRUPAL;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre!: string;

  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  version: number = 1;
}

export class ActualizarReglaValidacionDtoRequest {
  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsEnum(TipoDatoValidacion)
  tipo_dato?: TipoDatoValidacion;

  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsBoolean()
  obligatorio?: boolean;

  @IsOptional()
  @IsNumber()
  valor_min?: number | null;

  @IsOptional()
  @IsNumber()
  valor_max?: number | null;

  @IsOptional()
  @IsString()
  formato_regex?: string | null;

  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsArray()
  @IsString({ each: true })
  valores_permitidos?: string[];

  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  mensaje_error?: string;
}
