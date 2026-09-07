import { Transform } from 'class-transformer';
import { IsDate, IsNotEmpty, IsString, MaxLength } from 'class-validator';

function transformarFecha({ value }: { value: unknown }): Date | undefined {
  return typeof value === 'string' ? new Date(value) : undefined;
}

function normalizarMotivo({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class RegistrarPausaAdministrativaDtoRequest {
  @Transform(transformarFecha)
  @IsDate()
  fecha_inicio_pausa!: Date;

  @Transform(transformarFecha)
  @IsDate()
  fecha_fin_pausa!: Date;

  @Transform(normalizarMotivo)
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  motivo_pausa!: string;
}
