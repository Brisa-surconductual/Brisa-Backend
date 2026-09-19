import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDefined,
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
  ValidateNested,
} from 'class-validator';
import {
  OperadorCondicion,
  TipoDatoValidacion,
} from '../../domain/enums/arbol-conversacional.enums';

export class CrearFlujoGrupalDtoRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  version: number = 1;
}

export class CrearNodoConversacionalDtoRequest {
  @IsUUID()
  id_tipo_nodo!: string;

  @IsObject()
  @IsNotEmptyObject()
  contenido!: Record<string, unknown>;

  @IsOptional()
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
  @IsOptional()
  @IsUUID()
  id_tipo_nodo?: string;

  @IsOptional()
  @IsObject()
  @IsNotEmptyObject()
  contenido?: Record<string, unknown>;

  @IsOptional()
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

  @IsOptional()
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

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  valores_permitidos: string[] = [];

  @IsString()
  @IsNotEmpty()
  mensaje_error!: string;
}

export class ActualizarReglaValidacionDtoRequest {
  @IsOptional()
  @IsEnum(TipoDatoValidacion)
  tipo_dato?: TipoDatoValidacion;

  @IsOptional()
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

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  valores_permitidos?: string[];

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  mensaje_error?: string;
}

export class CrearTransicionConversacionalDtoRequest {
  @IsUUID()
  id_nodo_origen!: string;

  @IsUUID()
  id_nodo_destino!: string;

  @IsEnum(OperadorCondicion)
  operador_condicion!: OperadorCondicion;

  @IsDefined()
  valor_condicion!: unknown;

  @IsInt()
  @Min(1)
  orden_evaluacion!: number;

  @ValidateNested()
  @IsDefined()
  @Type(() => ReglaValidacionDtoRequest)
  regla_validacion!: ReglaValidacionDtoRequest;
}

export class ActualizarTransicionConversacionalDtoRequest {
  @IsOptional()
  @IsUUID()
  id_nodo_origen?: string;

  @IsOptional()
  @IsUUID()
  id_nodo_destino?: string;

  @IsOptional()
  @IsEnum(OperadorCondicion)
  operador_condicion?: OperadorCondicion;

  @IsOptional()
  valor_condicion?: unknown;

  @IsOptional()
  @IsInt()
  @Min(1)
  orden_evaluacion?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ActualizarReglaValidacionDtoRequest)
  regla_validacion?: ActualizarReglaValidacionDtoRequest;
}
