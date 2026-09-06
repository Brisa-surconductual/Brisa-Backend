import { IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

function toDateWithMidnight({ value }: { value: unknown }): Date | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return undefined;
  const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return new Date(soloFecha ? `${value}T00:00:00.000Z` : value);
}

export class ActualizarUnidadTemporalDtoRequest {
  @IsUUID()
  idUnidadTemporal!: string;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @Transform(toDateWithMidnight)
  fecha_inicio?: Date;

  @IsOptional()
  @Transform(toDateWithMidnight)
  fecha_fin?: Date;
}