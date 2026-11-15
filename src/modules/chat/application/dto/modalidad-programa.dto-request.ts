import { IsOptional } from 'class-validator';

export class HabilitarModalidadPersonalizadaDtoRequest {
  /** Debe ser `true`: la transición exige confirmación explícita (RF-25B). */
  @IsOptional()
  confirmacion_transicion?: unknown;
}
