import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import {
  CODIGO_PARTICIPANTE,
  normalizarCodigo,
} from './otorgar-permiso-individual.dto-request';

export const LIMITE_PERMISOS = 20;
export const LIMITE_MAXIMO_PERMISOS = 100;

export const entero = ({ value }: { value: unknown }) =>
  typeof value === 'string' && /^\d+$/u.test(value) ? Number(value) : value;

const booleano = ({ value }: { value: unknown }) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

/** Query de `GET /admin/permisos-individuales` (RF-04). */
export class ListarPermisosIndividualesDtoRequest {
  @IsOptional()
  @Transform(normalizarCodigo)
  @IsString()
  @Length(1, 16)
  @Matches(CODIGO_PARTICIPANTE)
  codigo_participante?: string;

  @Transform(booleano)
  @IsBoolean()
  solo_vigentes: boolean = false;

  @Transform(entero)
  @IsInt()
  @Min(0)
  offset: number = 0;

  @Transform(entero)
  @IsInt()
  @Min(1)
  @Max(LIMITE_MAXIMO_PERMISOS)
  limit: number = LIMITE_PERMISOS;
}
