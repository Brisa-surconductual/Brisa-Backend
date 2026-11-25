import { Transform } from 'class-transformer';
import {
  IsDefined,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const TIPO = /^[A-Z_]{1,50}$/u;

const mayusculas = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

const recortar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** Ruta `PUT /admin/configuracion/umbrales/:tipo_umbral` (RF-136). */
export class TipoUmbralDtoRequest {
  @Transform(mayusculas)
  @IsString()
  @Matches(TIPO)
  tipo_umbral!: string;
}

/** Ruta `PUT /admin/configuracion/notificaciones/:tipo_parametro` (RF-137). */
export class TipoParametroDtoRequest {
  @Transform(mayusculas)
  @IsString()
  @Matches(TIPO)
  tipo_parametro!: string;
}

/**
 * Cuerpo de los PUT de configuración (RF-136, RF-137). M-8 no valida la forma
 * ni el rango de los valores: eso lo hace el módulo dueño (M05 o M07).
 */
export class ActualizarConfiguracionDtoRequest {
  /** Valor propuesto: número, objeto o lista según el tipo. */
  @IsDefined()
  valor_nuevo!: unknown;

  /** Control optimista: el valor vigente que el cliente consultó. */
  @IsDefined()
  valor_anterior_esperado!: unknown;

  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MaxLength(500)
  justificacion_cambio?: string;
}
