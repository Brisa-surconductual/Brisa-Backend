import { Transform } from 'class-transformer';
import { IsString, Matches, ValidateIf } from 'class-validator';
import {
  FORMATO_CODIGO_PARTICIPANTE,
  normalizarCodigoParticipante,
} from '../../domain/policies/codigo-participante.policy';

/**
 * RF-38 (ampliación para M-8). `codigo_participante` es opcional: si se
 * envía, la sesión debe pertenecer a ese participante; si no, responde 404
 * como si la sesión no existiera (no confirma la asociación).
 */
export class ConsultarTrazabilidadSesionDtoRequest {
  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @Transform(
    ({ value }: { value: unknown }) =>
      normalizarCodigoParticipante(value) ?? value,
  )
  @IsString()
  @Matches(FORMATO_CODIGO_PARTICIPANTE)
  codigo_participante?: string;
}
