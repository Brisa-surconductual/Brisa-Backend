import { Transform } from 'class-transformer';
import {
  IsDefined,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  ModalidadConversacional,
  OperadorCondicion,
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/arbol-conversacional.enums';

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

export class CrearTransicionReutilizableDtoRequest {
  @IsUUID()
  id_nodo_origen!: string;

  @IsUUID()
  id_nodo_destino!: string;

  @IsUUID()
  id_regla_validacion!: string;

  @IsEnum(OperadorCondicion)
  operador_condicion!: OperadorCondicion;

  @IsDefined()
  @IsObject()
  valor_condicion!: Record<string, unknown>;

  @IsInt()
  @Min(1)
  orden_evaluacion!: number;
}

export class ActualizarTransicionReutilizableDtoRequest {
  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsUUID()
  id_nodo_destino?: string;

  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsUUID()
  id_regla_validacion?: string;

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
