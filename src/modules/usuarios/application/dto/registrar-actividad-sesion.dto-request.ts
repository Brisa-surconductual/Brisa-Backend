import { IsEnum } from 'class-validator';

export enum EstadoAplicacionDto {
  ACTIVA = 'ACTIVA',
  SEGUNDO_PLANO = 'SEGUNDO_PLANO',
}

export class RegistrarActividadSesionDtoRequest {
  @IsEnum(EstadoAplicacionDto)
  estadoAplicacion!: EstadoAplicacionDto;
}
