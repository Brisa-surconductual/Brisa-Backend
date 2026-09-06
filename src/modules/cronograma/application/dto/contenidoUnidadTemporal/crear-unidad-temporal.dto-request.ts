import { Transform } from 'class-transformer';
import { IsDate, IsString, IsUUID } from 'class-validator';

function toDateWithMidnight({ value }: { value: unknown }): Date | undefined {
  if (typeof value !== 'string') return undefined;

  const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return new Date(soloFecha ? `${value}T00:00:00.000Z` : value);
}

export class UnidadTemporalDtoRequest {
  @IsUUID()
  id_cronograma!: string;

  @IsString()
  nombre!: string;

  @Transform(toDateWithMidnight)
  @IsDate()
  fecha_inicio!: Date;

  @Transform(toDateWithMidnight)
  @IsDate()
  fecha_fin!: Date;
}