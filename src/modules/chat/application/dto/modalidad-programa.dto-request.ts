import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class ConsultarElegibilidadModalidadDtoRequest {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_programa!: number;
}

export class HabilitarModalidadPersonalizadaDtoRequest {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_programa!: number;

  /** Debe ser `true`: la transición exige confirmación explícita (RF-25B). */
  @IsOptional()
  confirmacion_transicion?: unknown;
}
