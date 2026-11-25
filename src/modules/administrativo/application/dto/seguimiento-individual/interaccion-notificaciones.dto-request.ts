import {
  IsDateString,
  IsOptional,
  Matches,
  Validate,
  type ValidationArguments,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';

const FECHA = /^\d{4}-\d{2}-\d{2}$/u;

/** `fecha_fin` no puede ser anterior a `fecha_inicio` (si llegan las dos). */
@ValidatorConstraint({ name: 'periodoOrdenado', async: false })
class FechaFinNoAnteriorAInicio implements ValidatorConstraintInterface {
  validate(fechaFin: unknown, args: ValidationArguments): boolean {
    const { fecha_inicio } = args.object as InteraccionNotificacionesDtoRequest;
    if (typeof fechaFin !== 'string' || typeof fecha_inicio !== 'string')
      return true;
    // Ambas en formato YYYY-MM-DD: el orden lexicográfico es el cronológico.
    return fecha_inicio <= fechaFin;
  }

  defaultMessage(): string {
    return 'fecha_fin no puede ser anterior a fecha_inicio';
  }
}

/**
 * Query de `GET /admin/participantes/:codigo/interaccion-notificaciones`
 * (RF-131). Sin fechas, el periodo es todo el programa.
 */
export class InteraccionNotificacionesDtoRequest {
  @IsOptional()
  @Matches(FECHA, { message: 'fecha_inicio debe tener el formato YYYY-MM-DD' })
  @IsDateString({ strict: true })
  fecha_inicio?: string;

  @IsOptional()
  @Matches(FECHA, { message: 'fecha_fin debe tener el formato YYYY-MM-DD' })
  @IsDateString({ strict: true })
  @Validate(FechaFinNoAnteriorAInicio)
  fecha_fin?: string;
}
