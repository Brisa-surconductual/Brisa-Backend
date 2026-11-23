import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ESTADOS_COHORTE } from '../../domain/cohorte';
import type { DatosCohorte, EstadoCohorte } from '../../domain/cohorte';

const FECHA_CALENDARIO = /^(?!0000)\d{4}-\d{2}-\d{2}$/u;
const recortarNombre = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CrearCohorteDto implements DatosCohorte {
  @Transform(recortarNombre)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre_cohorte!: string;

  @Matches(FECHA_CALENDARIO)
  @IsDateString({ strict: true })
  fecha_inicio_programa!: string;

  @Matches(FECHA_CALENDARIO)
  @IsDateString({ strict: true })
  fecha_fin_programa!: string;

  @IsUUID()
  id_cronograma!: string;
}

export class ActualizarCohorteDto implements Partial<DatosCohorte> {
  @ValidateIf((_: unknown, value: unknown) => value !== undefined)
  @Transform(recortarNombre)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre_cohorte?: string;

  @ValidateIf((_: unknown, value: unknown) => value !== undefined)
  @Matches(FECHA_CALENDARIO)
  @IsDateString({ strict: true })
  fecha_inicio_programa?: string;

  @ValidateIf((_: unknown, value: unknown) => value !== undefined)
  @Matches(FECHA_CALENDARIO)
  @IsDateString({ strict: true })
  fecha_fin_programa?: string;

  @ValidateIf((_: unknown, value: unknown) => value !== undefined)
  @IsUUID()
  id_cronograma?: string;

  @ValidateIf((_: unknown, value: unknown) => value !== undefined)
  @IsIn(ESTADOS_COHORTE)
  estado?: EstadoCohorte;
}
