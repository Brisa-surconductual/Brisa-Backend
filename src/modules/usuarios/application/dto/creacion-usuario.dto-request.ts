import { IsEmail, MinLength, IsDate, IsString, IsNumber, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { NivelAcademico } from '../../domain/enums/nivel-academico-enum';
import { MotivoConsumo } from '../../domain/enums/motivo-consumo-enum';

function toDateWithMidnight({ value }: { value: unknown }): Date | undefined {
    if (typeof value !== 'string') return undefined;
    const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(value);
    return new Date(soloFecha ? `${value}T00:00:00.000Z` : value);
}

export class CreacionUsuarioDtoRequest {
    @IsEmail()
    correoElectronico!: string;

    @MinLength(8)
    contrasena!: string;

    @Transform(toDateWithMidnight)
    @IsDate()
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