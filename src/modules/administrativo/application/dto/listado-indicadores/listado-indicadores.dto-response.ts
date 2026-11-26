import type { IndicadoresParticipanteListado } from '../../../domain/results/listado-indicadores';

export const MENSAJE_COHORTE_SIN_PARTICIPANTES =
  'No se encontraron participantes registrados para la cohorte seleccionada.';

/** Respuesta 200 de `GET /admin/cohortes/:id_cohorte/participantes/indicadores` (RF-142). */
export interface ListadoIndicadoresDtoResponse {
  items: IndicadoresParticipanteListado[];
  total: number;
  offset: number;
  limit: number;
  /** Solo cuando la cohorte no tiene participantes activos. */
  mensaje?: string;
}
