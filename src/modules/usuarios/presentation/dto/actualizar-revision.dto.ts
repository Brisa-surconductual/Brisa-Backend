import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MotivoConsumo } from '../../domain/enums/motivo-consumo-enum';
import { NivelAcademico } from '../../domain/enums/nivel-academico-enum';

export class ActualizarRevisionDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  ciudad?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  entidadEducativa?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  programaAcademico?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  semestre?: number;

  @IsOptional()
  @IsEnum(NivelAcademico)
  nivelAcademico?: NivelAcademico;

  @IsOptional()
  @IsInt()
  @Min(14)
  @Max(120)
  edad?: number;

  @IsOptional()
  @IsDateString({ strict: true })
  fechaInicioConsumo?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  fechaUltimoConsumo?: string;

  @IsOptional()
  @IsEnum(MotivoConsumo)
  motivoInicioConsumo?: MotivoConsumo;

  @IsOptional()
  @IsInt()
  @Min(0)
  frecuenciaConsumo?: number;
}
