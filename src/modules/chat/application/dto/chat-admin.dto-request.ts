import { Transform, Type } from 'class-transformer';
import {
  IsDefined,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';
import { OperadorCondicion } from '../../domain/enums/operador-condicional.enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/perfil-clinico.enum';

export class CrearFlujoConversacionalDtoRequest {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre!: string;

  @IsEnum(ModalidadConversacional)
  modalidad!: ModalidadConversacional;

  @ValidateIf(
    (dto: CrearFlujoConversacionalDtoRequest, value: unknown) =>
      dto.modalidad === ModalidadConversacional.PERSONALIZADA ||
      (value !== undefined && value !== null),
  )
  @IsEnum(TipoDependenciaClinica)
  tipo_dependencia?: TipoDependenciaClinica | null;

  @ValidateIf(
    (dto: CrearFlujoConversacionalDtoRequest, value: unknown) =>
      dto.modalidad === ModalidadConversacional.PERSONALIZADA ||
      (value !== undefined && value !== null),
  )
  @IsEnum(TipoCravingClinico)
  tipo_craving?: TipoCravingClinico | null;
}

/**
 * RF-25: lo único que el administrador define de la regla de una transición.
 * El tipo de dato, los valores permitidos y `obligatorio` se derivan del nodo
 * origen; el operador solo se elige cuando el nodo es de tipo número.
 */
export class ReglaTransicionDtoRequest {
  @IsOptional()
  @IsEnum(OperadorCondicion)
  operador_condicion?: OperadorCondicion;

  /** `{ valor }` en IGUALDAD, `{ min, max }` en RANGO; se omite en SIEMPRE. */
  @ValidateIf(
    (dto: ReglaTransicionDtoRequest) =>
      dto.operador_condicion !== OperadorCondicion.SIEMPRE ||
      dto.valor_esperado !== undefined,
  )
  @IsDefined()
  @IsObject()
  valor_esperado!: Record<string, unknown>;

  /** En SIEMPRE es opcional: se usa un mensaje genérico. */
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ValidateIf(
    (dto: ReglaTransicionDtoRequest) =>
      dto.operador_condicion !== OperadorCondicion.SIEMPRE ||
      dto.mensaje_error !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  mensaje_error!: string;
}

/**
 * RF-25: la transición lleva su propia regla (nunca una existente). Se omite
 * solo si el nodo origen no espera respuesta (transición automática).
 */
export class CrearTransicionConversacionalDtoRequest {
  @IsUUID()
  id_nodo_origen!: string;

  @IsUUID()
  id_nodo_destino!: string;

  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsObject()
  @ValidateNested()
  @Type(() => ReglaTransicionDtoRequest)
  regla_validacion?: ReglaTransicionDtoRequest;

  /** Opcional: por defecto, máximo de las transiciones específicas del origen + 1. */
  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  orden_evaluacion?: number;

  /**
   * RF-25: destino de "cualquier otra respuesta". Crea la transición por
   * defecto (SIEMPRE) del origen o redirige la existente.
   */
  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsUUID()
  id_nodo_destino_otro?: string;
}

/** `regla_validacion` reemplaza por completo la regla propia. El origen no se modifica. */
export class ActualizarTransicionConversacionalDtoRequest {
  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsUUID()
  id_nodo_destino?: string;

  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsObject()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ReglaTransicionDtoRequest)
  regla_validacion?: ReglaTransicionDtoRequest;

  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  orden_evaluacion?: number;
}
