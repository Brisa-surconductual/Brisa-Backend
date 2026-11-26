import { Transform } from 'class-transformer';
import { IsIn, IsString, Length } from 'class-validator';
import {
  LONGITUD_MAXIMA_MOTIVO,
  LONGITUD_MINIMA_MOTIVO,
} from '../../../domain/value-objects/motivo-atencion.vo';

export const ACCION_MARCAR_ATENDIDA = 'MARCAR_ATENDIDA';

/**
 * Body de `POST /admin/alertas/:id_alerta/atender` (RF-147). El tipo y el
 * participante no se reciben: se piden a M05. El motivo es obligatorio.
 */
export class MarcarAlertaAtendidaDtoRequest {
  @IsIn([ACCION_MARCAR_ATENDIDA], {
    message: `accion debe ser ${ACCION_MARCAR_ATENDIDA}.`,
  })
  accion!: typeof ACCION_MARCAR_ATENDIDA;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'El motivo es obligatorio.' })
  @Length(LONGITUD_MINIMA_MOTIVO, LONGITUD_MAXIMA_MOTIVO, {
    message: `El motivo debe tener entre ${LONGITUD_MINIMA_MOTIVO} y ${LONGITUD_MAXIMA_MOTIVO} caracteres.`,
  })
  motivo!: string;
}
