import { IsEmail, MinLength } from 'class-validator';

export class CreacionUsuarioAdminDtoRequest {
    @IsEmail()
    correoElectronico!: string;
    @MinLength(8)
    contrasena!: string
}