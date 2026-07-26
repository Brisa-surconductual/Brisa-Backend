import { IsEnum } from 'class-validator';
import { EstadoAplicacion } from '../../domain/enums/estado-aplicacion-enum';

export class EstadoAplicacionDto {
  @IsEnum(EstadoAplicacion)
  estado!: EstadoAplicacion;
}
