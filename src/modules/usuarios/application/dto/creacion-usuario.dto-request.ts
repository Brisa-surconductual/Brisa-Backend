import { IsEmail, MinLength, IsDate, IsBoolean, IsString, IsNumber, IsEnum } from 'class-validator';
import { NivelAcademico } from '../../domain/enums/nivel-academico-enum';
import { MotivoConsumo } from '../../domain/enums/motivo-consumo-enum';

export class CreacionUsuarioDtoRequest {
    @IsEmail()
    correoElectronico!: string;

    @MinLength(8)
    contrasena!: string;

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

    @IsDate()
    fechaInicioConsumo!: Date;

    @IsDate()
    fechaUltimoConsumo!: Date;

    @IsEnum(MotivoConsumo)
    motivoInicioConsumo!: MotivoConsumo;

    @IsNumber()
    frecuenciaConsumo!: number;
}