import { Transform } from 'class-transformer';
import { IsInt, Max, Min, ValidateIf } from 'class-validator';

/** RF-32: «las últimas 20 interacciones», paginadas hacia atrás. */
export const LIMITE_HISTORIAL_INTERACCIONES = 20;

function enteroConsulta({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return value;
  const numero = Number(value);
  return Number.isSafeInteger(numero) ? numero : value;
}

export class ConsultarHistorialInteraccionesDtoRequest {
  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @Transform(enteroConsulta)
  @IsInt()
  @Min(1)
  @Max(2_147_483_647)
  antes_de_secuencia?: number;

  @Transform(enteroConsulta)
  @IsInt()
  @Min(1)
  @Max(LIMITE_HISTORIAL_INTERACCIONES)
  limite: number = LIMITE_HISTORIAL_INTERACCIONES;
}
