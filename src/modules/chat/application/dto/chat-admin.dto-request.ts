import { Transform, Type } from 'class-transformer';
import {
  IsDefined,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  ActualizarReglaValidacionDtoRequest,
  ReglaValidacionDtoRequest,
} from './arbol-conversacional.dto-request';
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
 * La regla de validación se indica con `id_regla_validacion` (regla existente)
 * o con `regla_validacion` (regla nueva embebida), exclusivamente una de las dos.
 */
export class CrearTransicionConversacionalDtoRequest {
  @IsUUID()
  id_nodo_origen!: string;

  @IsUUID()
  id_nodo_destino!: string;

  @ValidateIf(
    (dto: CrearTransicionConversacionalDtoRequest) =>
      dto.regla_validacion === undefined,
  )
  @IsUUID()
  id_regla_validacion?: string;

  @ValidateIf(
    (dto: CrearTransicionConversacionalDtoRequest) =>
      dto.id_regla_validacion === undefined,
  )
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => ReglaValidacionDtoRequest)
  regla_validacion?: ReglaValidacionDtoRequest;

  @IsEnum(OperadorCondicion)
  operador_condicion!: OperadorCondicion;

  @IsDefined()
  @IsObject()
  valor_condicion!: Record<string, unknown>;

  @IsInt()
  @Min(1)
  orden_evaluacion!: number;
}

/**
 * La regla de validación se puede sustituir (`id_regla_validacion`) o editar
 * (`regla_validacion`), nunca ambas cosas a la vez. El origen no se modifica.
 */
export class ActualizarTransicionConversacionalDtoRequest {
  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsUUID()
  id_nodo_destino?: string;

  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsUUID()
  id_regla_validacion?: string;

  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsObject()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ActualizarReglaValidacionDtoRequest)
  regla_validacion?: ActualizarReglaValidacionDtoRequest;

  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsEnum(OperadorCondicion)
  operador_condicion?: OperadorCondicion;

  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsDefined()
  @IsObject()
  valor_condicion?: Record<string, unknown>;

  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  orden_evaluacion?: number;
}
