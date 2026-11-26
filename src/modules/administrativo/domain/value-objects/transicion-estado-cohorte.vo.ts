import { EstadoCohorte } from '../enums/estado-cohorte.enum';

/** Único estado al que puede pasar una cohorte desde cada estado (RF-124). */
export const SIGUIENTE_ESTADO_COHORTE: Readonly<
  Record<EstadoCohorte, EstadoCohorte>
> = {
  [EstadoCohorte.BORRADOR]: EstadoCohorte.ACTIVA,
  [EstadoCohorte.ACTIVA]: EstadoCohorte.INACTIVA,
  [EstadoCohorte.INACTIVA]: EstadoCohorte.ACTIVA,
};

export function esTransicionCohortePermitida(
  actual: EstadoCohorte,
  destino: EstadoCohorte,
): boolean {
  return SIGUIENTE_ESTADO_COHORTE[actual] === destino;
}
