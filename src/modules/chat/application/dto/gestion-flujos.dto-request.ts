import { Transform } from 'class-transformer';
import { IsEnum, IsInt, Max, Min, ValidateIf } from 'class-validator';
import { EstadoFlujoConversacional } from '../../domain/enums/estado-flujo-conversacional.enum';
import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/perfil-clinico.enum';

function enteroConsulta({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return value;
  const numero = Number(value);
  return Number.isSafeInteger(numero) ? numero : value;
}

export class ListarFlujosDtoRequest {
  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsEnum(ModalidadConversacional)
  modalidad?: ModalidadConversacional;

  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsEnum(TipoDependenciaClinica)
  tipo_dependencia?: TipoDependenciaClinica;

  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsEnum(TipoCravingClinico)
  tipo_craving?: TipoCravingClinico;

  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsEnum(EstadoFlujoConversacional)
  estado?: EstadoFlujoConversacional;

  @Transform(enteroConsulta)
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  page = 1;

  @Transform(enteroConsulta)
  @IsInt()
  @Min(1)
  @Max(100)
  page_size = 20;
}
