import type { EstadoFuenteAgregada } from '../../domain/enums/estado-fuente-agregada.enum';

export type ResultadoEvolucionSeguimiento = { id_cohorte: string } & (
  | { estado: typeof EstadoFuenteAgregada.ACTUALIZADO; datos: unknown }
  | { estado: typeof EstadoFuenteAgregada.NO_DISPONIBLE }
);

/**
 * RF-78 por RF-55. Los datos incluyen fecha_actualizacion,
 * id_ultima_unidad_transcurrida (null al inicio) e indicadores por unidad.
 * Un fallo técnico debe informarse para toda la serie.
 */
export abstract class EvolucionSeguimientoPort {
  abstract obtener(idCohorte: string): Promise<ResultadoEvolucionSeguimiento>;
}
