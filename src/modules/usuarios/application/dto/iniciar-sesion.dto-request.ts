import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class IniciarSesionDtoRequest {
  @IsEmail()
  correoElectronico!: string;

  @IsString()
  @IsNotEmpty()
  contrasena!: string;
}
