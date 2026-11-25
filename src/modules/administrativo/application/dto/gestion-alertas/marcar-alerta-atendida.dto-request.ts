import { Transform } from 'class-transformer';
import { IsString, IsUUID, Length, Matches } from 'class-validator';
import {
  LONGITUD_MAXIMA_MOTIVO,
  LONGITUD_MINIMA_MOTIVO,
} from '../../../domain/value-objects/motivo-atencion.vo';
import {
  CODIGO_PARTICIPANTE,
  normalizarCodigo,
} from '../permisos-individuales/otorgar-permiso-individual.dto-request';

/** Ruta `/admin/participantes/:codigo_participante/alertas/:id_alerta/atender`. */
export class AlertaParticipanteDtoRequest {
  @Transform(normalizarCodigo)
  @IsString()
  @Length(1, 16)
  @Matches(CODIGO_PARTICIPANTE)
  codigo_participante!: string;

  @IsUUID()
  id_alerta!: string;
}

/** Body de la acción "marcar como atendida" (RF-147): el motivo es obligatorio. */
export class MarcarAlertaAtendidaDtoRequest {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'El motivo es obligatorio.' })
  @Length(LONGITUD_MINIMA_MOTIVO, LONGITUD_MAXIMA_MOTIVO, {
    message: `El motivo debe tener entre ${LONGITUD_MINIMA_MOTIVO} y ${LONGITUD_MAXIMA_MOTIVO} caracteres.`,
  })
  motivo!: string;
}
