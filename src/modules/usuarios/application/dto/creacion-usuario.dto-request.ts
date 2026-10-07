import {
  IsEmail,
  MinLength,
  IsDate,
  IsString,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { NivelAcademico } from '../../domain/enums/nivel-academico-enum';
import { MotivoConsumo } from '../../domain/enums/motivo-consumo-enum';
import { EsMayorDeEdad } from '../validators/es-mayor-de-edad.validator';

function toDateWithMidnight({ value }: { value: unknown }): Date | undefined {
  if (typeof value !== 'string') return undefined;
  const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return new Date(soloFecha ? `${value}T00:00:00.000Z` : value);
}

function toStrictBirthDate({ value }: { value: unknown }): Date | undefined {
  if (typeof value !== 'string') return undefined;

  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00\.000Z)?$/.exec(
    value,
  );
  if (!coincidencia) return undefined;

  const fecha = new Date(
    `${coincidencia[1]}-${coincidencia[2]}-${coincidencia[3]}T00:00:00.000Z`,
  );
  const anio = Number(coincidencia[1]);
  const mes = Number(coincidencia[2]);
  const dia = Number(coincidencia[3]);

  const fechaCalendarioValida =
    !Number.isNaN(fecha.getTime()) &&
    fecha.getUTCFullYear() === anio &&
    fecha.getUTCMonth() === mes - 1 &&
    fecha.getUTCDate() === dia;

  return fechaCalendarioValida ? fecha : undefined;
}

export class CreacionUsuarioDtoRequest {
  @IsEmail()
  correoElectronico!: string;

  @MinLength(8)
  contrasena!: string;

  @Transform(toStrictBirthDate)
  @IsDate({
    message:
      'fechaNacimiento debe ser una fecha válida en formato YYYY-MM-DD o YYYY-MM-DDT00:00:00.000Z.',
  })
  @EsMayorDeEdad(18, {
    message: 'El usuario debe tener al menos 18 años cumplidos.',
  })
  fechaNacimiento!: Date;

  @IsString()
  ciudad!: string;

  @IsString()
  entidad_educativa!: string;

  @IsString()
  programa_academico!: string;

  @IsNumber()
  semestre!: number;

  @IsEnum(NivelAcademico)
  nivelAcademico!: NivelAcademico;

  @Transform(toDateWithMidnight)
  @IsDate()
  fechaInicioConsumo!: Date;

  @Transform(toDateWithMidnight)
  @IsDate()
  fechaUltimoConsumo!: Date;

  @IsEnum(MotivoConsumo)
  motivoInicioConsumo!: MotivoConsumo;

  @IsNumber()
  frecuenciaConsumo!: number;
}
