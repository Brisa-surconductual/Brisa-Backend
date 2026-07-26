import {
  IsDateString,
  IsEnum,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MotivoConsumo } from '../../domain/enums/motivo-consumo-enum';
import { NivelAcademico } from '../../domain/enums/nivel-academico-enum';

export class LineaBaseDto {
  @IsString()
  @MaxLength(150)
  ciudad!: string;

  @IsString()
  @MaxLength(255)
  entidadEducativa!: string;

  @IsString()
  @MaxLength(255)
  programaAcademico!: string;

  @IsInt()
  @Min(1)
  @Max(20)
  semestre!: number;

  @IsEnum(NivelAcademico)
  nivelAcademico!: NivelAcademico;

  @IsInt()
  @Min(14)
  @Max(120)
  edad!: number;

  @IsDateString({ strict: true })
  fechaInicioConsumo!: string;

  @IsDateString({ strict: true })
  fechaUltimoConsumo!: string;

  @IsEnum(MotivoConsumo)
  motivoInicioConsumo!: MotivoConsumo;

  @IsInt()
  @Min(0)
  frecuenciaConsumo!: number;
}
