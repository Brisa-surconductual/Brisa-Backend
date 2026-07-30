import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

export class CrearUsuarioDto {
  @IsEmail()
  @MaxLength(255)
  correoElectronico!: string;

  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_PATTERN)
  contrasena!: string;

  @IsString()
  confirmarContrasena!: string;
}
