import { ContenidoCronograma } from '../../domain/entities/contenido-cronograma.entity';

export interface LimitesDisponibilidad {
  minFechaInicio: Date | null;
  maxFechaFin: Date | null;
}

export function calcularLimitesDisponibles(
  hermanas: ContenidoCronograma[],
  fechaInicioCandidata: Date,
): LimitesDisponibilidad {
  const anterior = hermanas
    .filter((h) => h.fecha_fin_disponibilidad <= fechaInicioCandidata)
    .sort(
      (a, b) =>
        b.fecha_fin_disponibilidad.getTime() - a.fecha_fin_disponibilidad.getTime(),
    )[0];

  const siguiente = hermanas
    .filter((h) => h.fecha_inicio_disponibilidad > fechaInicioCandidata)
    .sort(
      (a, b) =>
        a.fecha_inicio_disponibilidad.getTime() - b.fecha_inicio_disponibilidad.getTime(),
    )[0];

  return {
    minFechaInicio: anterior ? anterior.fecha_fin_disponibilidad : null,
    maxFechaFin: siguiente ? siguiente.fecha_inicio_disponibilidad : null,
  };
}

export function construirMensajeLimite(limites: LimitesDisponibilidad): string {
  if (limites.maxFechaFin) {
    return `Con esa fecha de inicio, la disponibilidad puede extenderse como máximo hasta ${limites.maxFechaFin.toISOString().slice(0, 10)}.`;
  }
  if (limites.minFechaInicio) {
    return `La disponibilidad no puede iniciar antes de ${limites.minFechaInicio.toISOString().slice(0, 10)}.`;
  }
  return 'La disponibilidad se solapa con otra asociación existente.';
}