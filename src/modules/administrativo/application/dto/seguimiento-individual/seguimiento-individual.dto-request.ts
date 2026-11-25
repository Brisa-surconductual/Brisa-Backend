import { Transform } from 'class-transformer';
import { IsInt, IsString, Length, Matches, Max, Min } from 'class-validator';
import {
  CODIGO_PARTICIPANTE,
  normalizarCodigo,
} from '../permisos-individuales/otorgar-permiso-individual.dto-request';

export const LIMITE_ALERTAS = 20;
export const LIMITE_MAXIMO_ALERTAS = 100;

const entero = ({ value }: { value: unknown }) =>
  typeof value === 'string' && /^\d+$/u.test(value) ? Number(value) : value;

/** Ruta `/admin/participantes/:codigo_participante/...` (RF-128, RF-129). */
export class CodigoParticipanteDtoRequest {
  @Transform(normalizarCodigo)
  @IsString()
  @Length(1, 16)
  @Matches(CODIGO_PARTICIPANTE)
  codigo_participante!: string;
}

/** Query de `GET /admin/participantes/:codigo_participante/alertas` (RF-129). */
export class HistorialAlertasDtoRequest {
  @Transform(entero)
  @IsInt()
  @Min(0)
  offset: number = 0;

  @Transform(entero)
  @IsInt()
  @Min(1)
  @Max(LIMITE_MAXIMO_ALERTAS)
  limit: number = LIMITE_ALERTAS;
}
