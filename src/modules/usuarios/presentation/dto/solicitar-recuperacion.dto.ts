import { IsEmail, MaxLength } from 'class-validator';

export class SolicitarRecuperacionDto {
  @IsEmail()
  @MaxLength(255)
  correoElectronico!: string;
}
