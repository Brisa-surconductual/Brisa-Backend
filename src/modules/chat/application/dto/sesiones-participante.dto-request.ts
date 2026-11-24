import { Transform } from 'class-transformer';
import {
  IsInt,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { enteroConsulta } from './historial-interacciones.dto-request';

/** RF-38 (M-8): tamaño de página por defecto y máximo del listado. */
export const LIMITE_SESIONES_PARTICIPANTE = 20;
export const LIMITE_MAXIMO_SESIONES_PARTICIPANTE = 50;

export class ListarSesionesParticipanteDtoRequest {
  @Transform(enteroConsulta)
  @IsInt()
  @Min(1)
  @Max(LIMITE_MAXIMO_SESIONES_PARTICIPANTE)
  limite: number = LIMITE_SESIONES_PARTICIPANTE;

  /** Cursor opaco devuelto en `siguiente_cursor` (base64url). */
  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(200)
  @Matches(/^[A-Za-z0-9_-]+$/)
  cursor?: string;
}
