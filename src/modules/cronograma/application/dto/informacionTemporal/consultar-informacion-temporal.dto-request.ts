import { Transform } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

function transformarFecha({ value }: { value: unknown }): Date | undefined {
  if (value === undefined) {
    return undefined;
  }

  return typeof value === 'string' ? new Date(value) : undefined;
}

export class ConsultarInformacionTemporalDtoRequest {
  @IsOptional()
  @Transform(transformarFecha)
  @IsDate()
  fecha_consulta?: Date;
}
