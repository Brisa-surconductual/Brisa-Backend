import { IS_ENUM, IsBoolean, IsDate, IsEnum, IsString } from 'class-validator';
import { EstadoCronograma } from '../../../domain/enums/estado-cronograma.enum';
import { Transform } from 'class-transformer';

function toDateWithMidnight({ value }: { value: unknown }): Date | undefined {
  if (typeof value !== 'string') return undefined;

  const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return new Date(soloFecha ? `${value}T00:00:00.000Z` : value);
}

export class CrearCronogramaDtoRequest {

  @IsString()
  nombre!: string;
  @IsDate()
  @Transform(toDateWithMidnight)
  fecha_activacion!: Date;
  @IsBoolean()
  es_base: boolean;
}
