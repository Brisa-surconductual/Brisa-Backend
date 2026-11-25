import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
  Validate,
  type ValidationArguments,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';
import {
  NIVELES_PROGRESO,
  type NivelProgreso,
} from '../../../domain/enums/nivel-progreso.enum';
import {
  CAMPOS_ORDEN_LISTADO,
  type CampoOrdenListado,
  type DireccionOrden,
} from '../../../domain/results/listado-indicadores';

export const LIMITE_LISTADO = 20;
export const LIMITE_MAXIMO_LISTADO = 100;

/** "0.5" → 0.5; cualquier otra cosa se deja para que falle la validación. */
const numero = ({ value }: { value: unknown }) =>
  typeof value === 'string' && /^\d+(\.\d+)?$/u.test(value)
    ? Number(value)
    : value;

const entero = ({ value }: { value: unknown }) =>
  typeof value === 'string' && /^\d+$/u.test(value) ? Number(value) : value;

const booleano = ({ value }: { value: unknown }) =>
  value === 'true' ? true : value === 'false' ? false : value;

const mayusculas = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.toUpperCase() : value;

/** adherencia_min no puede superar a adherencia_max (si llegan las dos). */
@ValidatorConstraint({ name: 'rangoAdherencia', async: false })
class RangoAdherenciaValido implements ValidatorConstraintInterface {
  validate(max: unknown, args: ValidationArguments): boolean {
    const { adherencia_min: min } = args.object as ListadoIndicadoresDtoRequest;
    return typeof min !== 'number' || typeof max !== 'number' || min <= max;
  }

  defaultMessage(): string {
    return 'adherencia_min debe ser menor o igual que adherencia_max.';
  }
}

/**
 * Query de `GET /admin/cohortes/:id_cohorte/participantes/indicadores`
 * (RF-142). Reemplaza el `filtro_indicador` / `valor_filtro` genérico del RF
 * por parámetros tipados y combinables. Se valida con `whitelist`: cualquier
 * otro parámetro se descarta.
 */
export class ListadoIndicadoresDtoRequest {
  @IsOptional()
  @Transform(mayusculas)
  @IsIn(NIVELES_PROGRESO, {
    message: `nivel_progreso debe ser uno de: ${NIVELES_PROGRESO.join(', ')}.`,
  })
  nivel_progreso?: NivelProgreso;

  @IsOptional()
  @Transform(numero)
  @IsNumber({}, { message: 'adherencia_min debe ser un número entre 0 y 1.' })
  @Min(0, { message: 'adherencia_min debe ser un número entre 0 y 1.' })
  @Max(1, { message: 'adherencia_min debe ser un número entre 0 y 1.' })
  adherencia_min?: number;

  @IsOptional()
  @Transform(numero)
  @IsNumber({}, { message: 'adherencia_max debe ser un número entre 0 y 1.' })
  @Min(0, { message: 'adherencia_max debe ser un número entre 0 y 1.' })
  @Max(1, { message: 'adherencia_max debe ser un número entre 0 y 1.' })
  @Validate(RangoAdherenciaValido)
  adherencia_max?: number;

  @IsOptional()
  @Transform(booleano)
  @IsBoolean({ message: 'con_alertas debe ser true o false.' })
  con_alertas?: boolean;

  @IsOptional()
  @IsIn(CAMPOS_ORDEN_LISTADO, {
    message: `orden_campo debe ser uno de: ${CAMPOS_ORDEN_LISTADO.join(', ')}.`,
  })
  orden_campo: CampoOrdenListado = 'codigo_participante';

  @IsOptional()
  @Transform(mayusculas)
  @IsIn(['ASC', 'DESC'], { message: 'orden_direccion debe ser ASC o DESC.' })
  orden_direccion: DireccionOrden = 'ASC';

  @IsOptional()
  @Transform(entero)
  @IsInt({ message: 'offset debe ser un entero mayor o igual que 0.' })
  @Min(0, { message: 'offset debe ser un entero mayor o igual que 0.' })
  offset: number = 0;

  @IsOptional()
  @Transform(entero)
  @IsInt({
    message: `limit debe ser un entero entre 1 y ${LIMITE_MAXIMO_LISTADO}.`,
  })
  @Min(1, {
    message: `limit debe ser un entero entre 1 y ${LIMITE_MAXIMO_LISTADO}.`,
  })
  @Max(LIMITE_MAXIMO_LISTADO, {
    message: `limit debe ser un entero entre 1 y ${LIMITE_MAXIMO_LISTADO}.`,
  })
  limit: number = LIMITE_LISTADO;
}

/** Parámetros que el listado acepta; el resto se descarta. */
export const PARAMETROS_LISTADO: ReadonlySet<string> = new Set([
  'nivel_progreso',
  'adherencia_min',
  'adherencia_max',
  'con_alertas',
  'orden_campo',
  'orden_direccion',
  'offset',
  'limit',
]);
