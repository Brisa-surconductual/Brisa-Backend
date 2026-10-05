import { IsOptional, IsString } from 'class-validator';

export class BuscarUsuariosQueryDto {
  @IsString()
  @IsOptional()
  q?: string;
}
