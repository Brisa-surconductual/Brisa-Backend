import { IsEmail, MinLength, IsDate, IsBoolean, IsString, IsNumber } from 'class-validator';
import {Rol} from '../../domain/enums/rol.enum';
import {EstadoRegistro} from '../../domain/enums/estado-registro.enum';
import {EstadoCuenta} from '../../domain/enums/estado-cuenta';
import { NivelAcademico } from '../../domain/enums/nivel-academico-enum';
import { MotivoConsumo } from '../../domain/enums/motivo-consumo-enum';


export class CreacionUsuarioDtoRequest {
    @IsEmail()
    correoElectronico!:string;

    @MinLength(8)
    constrasenaHash!:string;

    @IsDate()
    fechaNacimiento!:Date;

    @IsString()
    rol!:Rol;

    estadoRegistro!:EstadoRegistro;

    estadoCuenta!:EstadoCuenta;

    @IsDate()
    fechaRegistro!:Date;

    @IsBoolean()
    registroConsumoAceptado!:boolean;
    
    @IsBoolean()
    consentimientoAceptado!:boolean;

    @IsString()
    idConsentimiento!:string;
    

    @IsString()
    ciudad!:string;

    @IsString()
    entidad_educativa!:string;

    @IsString()
    programa_academico!:string;

    @IsNumber()
    semestre!:number;

    @IsString()
    nivelAcademico!:NivelAcademico;

    @IsDate()
    fechaInicioConsumo!:Date;

    @IsDate()
    fechaUltimoConsumo!:Date;

    @IsString()
    motivoInicioConsumo!:MotivoConsumo;

    @IsNumber()
    frecuenciaConsumo!:number;

    @IsDate()
    fechaCreacion!:Date;
}