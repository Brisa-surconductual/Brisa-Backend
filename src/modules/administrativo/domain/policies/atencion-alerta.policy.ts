import {
  EstadoResolucionAlerta,
  type EstadoResolucionAlerta as TipoEstadoResolucion,
} from '../enums/estado-resolucion-alerta.enum';
import {
  AlertaNoActivaException,
  AlertaYaAtendidaException,
} from '../exceptions/gestion-alerta.exceptions';

const ESTADOS_ATENDIBLES: readonly TipoEstadoResolucion[] = [
  EstadoResolucionAlerta.ACTIVA,
  EstadoResolucionAlerta.PENDIENTE,
];

const ESTADOS_YA_ATENDIDOS: readonly TipoEstadoResolucion[] = [
  EstadoResolucionAlerta.ATENDIDA,
  EstadoResolucionAlerta.RESUELTA,
];

/**
 * RF-147: una alerta se puede marcar como atendida solo si está ACTIVA o
 * PENDIENTE y nadie la atendió todavía en M-8. Sin estado informado por M05 se
 * considera ACTIVA (misma regla que el historial de RF-129). Es irreversible.
 */
export function asegurarAlertaAtendible(
  estadoM05: TipoEstadoResolucion | null | undefined,
  yaAtendidaEnM08: boolean,
): void {
  const estado = estadoM05 ?? EstadoResolucionAlerta.ACTIVA;
  if (yaAtendidaEnM08 || ESTADOS_YA_ATENDIDOS.includes(estado))
    throw new AlertaYaAtendidaException();
  if (!ESTADOS_ATENDIBLES.includes(estado))
    throw new AlertaNoActivaException(estado);
}
