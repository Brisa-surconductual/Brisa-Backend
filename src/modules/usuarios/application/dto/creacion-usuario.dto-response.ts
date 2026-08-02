import { IsEmail, IsDate, IsBoolean, IsString } from 'class-validator';
import { Usuario } from "../../domain/entities/usuarios.entity";
import {LineaBase} from "../../domain/entities/linea-bases.entity";

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

    static crear(usuario: Usuario, lineaBase: LineaBase): CreacionUsuarioDtoResponse {
        const dto = new CreacionUsuarioDtoResponse();
        dto.correo_electronico = usuario.correo.value;
        dto.fecha_nacimiento = lineaBase.fechaNacimiento;
        dto.rol = usuario.rol;
        dto.fecha_registro = usuario.fechaRegistro;
        dto.estado_registro = usuario.estadoRegistro.toString();
        dto.estado_cuenta = usuario.estadoCuenta.toString();
        dto.consentimiento_aceptado = usuario.consentimeintoAceptado;
        return dto;
    }


}