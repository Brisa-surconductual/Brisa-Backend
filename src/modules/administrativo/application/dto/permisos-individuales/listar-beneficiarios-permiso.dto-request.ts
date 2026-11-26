import { Transform } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import {
  entero,
  LIMITE_MAXIMO_PERMISOS,
  LIMITE_PERMISOS,
} from './listar-permisos-individuales.dto-request';

/** Query de `GET /admin/permisos-individuales/beneficiarios` (BE-336). */
export class ListarBeneficiariosPermisoDtoRequest {
  @Transform(entero)
  @IsInt()
  @Min(0)
  offset: number = 0;

  @Transform(entero)
  @IsInt()
  @Min(1)
  @Max(LIMITE_MAXIMO_PERMISOS)
  limit: number = LIMITE_PERMISOS;
}
