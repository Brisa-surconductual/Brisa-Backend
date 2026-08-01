import { IsEmail, IsDate, IsBoolean, IsString } from 'class-validator';

export class CreacionUsuarioDtoResponse {
    @IsEmail()
    correo_electronico!:string;

    @IsDate()
    fecha_nacimiento!:Date;

    @IsString()
    rol!:string;

    @IsDate()
    fecha_registro!:Date;

    @IsString()
    estado_registro!:string;

    @IsString()
    estado_cuenta!:string;

    @IsBoolean()
    consentimiento_aceptado!:boolean;

}