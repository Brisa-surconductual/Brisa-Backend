import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import type { TipoAlerta } from '../../../domain/results/seguimiento-individual';

export const TIPOS_ALERTA: readonly TipoAlerta[] = [
  'CRAVING_ELEVADO',
  'INACTIVIDAD',
];
export const LIMITE_PENDIENTES = 20;
export const LIMITE_MAXIMO_PENDIENTES = 100;

const entero = ({ value }: { value: unknown }) =>
  typeof value === 'string' && /^\d+$/u.test(value) ? Number(value) : value;

/** Query de `GET /admin/cohortes/:id_cohorte/alertas/pendientes` (RF-146). */
export class AlertasPendientesDtoRequest {
  @IsOptional()
  @IsIn(TIPOS_ALERTA)
  tipo_alerta?: TipoAlerta;

  @Transform(entero)
  @IsInt()
  @Min(0)
  offset: number = 0;

  @Transform(entero)
  @IsInt()
  @Min(1)
  @Max(LIMITE_MAXIMO_PENDIENTES)
  limit: number = LIMITE_PENDIENTES;
}
