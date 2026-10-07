import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

function transformarFecha({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? new Date(value) : value;
}

function transformarBooleano({ value }: { value: unknown }): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

function transformarNumero({ value }: { value: unknown }): unknown {
  return typeof value === 'string' && value.length > 0 ? Number(value) : value;
}

export class ConsultarUbicacionesTemporalesParticipantesDtoRequest {
  @IsOptional()
  @Transform(transformarNumero)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(transformarNumero)
  @IsInt()
  @Min(1)
  @Max(100)
  page_size: number = 50;

  @IsOptional()
  @Transform(transformarFecha)
  @IsDate()
  fecha_calculo?: Date;

  @IsOptional()
  @IsUUID()
  id_usuario?: string;

  @IsOptional()
  @IsUUID()
  id_cronograma?: string;

  @IsOptional()
  @IsUUID()
  id_unidad_temporal?: string;

  @IsOptional()
  @Transform(transformarBooleano)
  @IsBoolean()
  cronograma_finalizado?: boolean;
}
