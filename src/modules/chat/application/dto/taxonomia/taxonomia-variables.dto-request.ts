import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDefined,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TipoEntradaRespuesta } from '../../../domain/enums/tipo-entrada-respuesta.enum';
import { TipoValorVariable } from '../../../domain/enums/tipo-valor-variable.enum';

/** RF-30B: GET /chat/taxonomia-variables. */
export class ConsultarTaxonomiaVariablesDtoRequest {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  incluir_deshabilitadas?: boolean;
}

/**
 * RF-30B: POST /chat/taxonomia-variables. Aquí solo se valida la forma; la
 * coherencia (entradas por tipo, rangos, valores) es regla de dominio (422).
 */
export class CrearVariableTaxonomiaDtoRequest {
  @IsString()
  @MaxLength(60)
  codigo!: string;

  @IsString()
  @MaxLength(120)
  nombre!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @IsEnum(TipoValorVariable)
  tipo_valor!: TipoValorVariable;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  valores?: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(TipoEntradaRespuesta, { each: true })
  tipos_entrada_permitidos!: TipoEntradaRespuesta[];

  /** ENTERO: `[{ min, max, etiqueta }]`; CATEGORIA/BOOLEANO: `{ valor: etiqueta }`. */
  @IsDefined()
  etiquetas!: unknown;
}

/** RF-30B: PATCH /chat/taxonomia-variables/{codigo}. */
export class CambiarEstadoVariableTaxonomiaDtoRequest {
  @IsBoolean()
  habilitada!: boolean;
}
