import { IsString, Matches, MinLength } from 'class-validator';

const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

export class RestablecerContrasenaDto {
  @IsString()
  @MinLength(32)
  token!: string;

  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_PATTERN)
  nuevaContrasena!: string;

  @IsString()
  confirmarNuevaContrasena!: string;
}
