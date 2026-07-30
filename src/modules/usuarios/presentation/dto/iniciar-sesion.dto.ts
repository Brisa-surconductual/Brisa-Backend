import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class IniciarSesionDto {
  @IsEmail()
  @MaxLength(255)
  correoElectronico!: string;

  @IsString()
  @MinLength(1)
  contrasena!: string;
}
