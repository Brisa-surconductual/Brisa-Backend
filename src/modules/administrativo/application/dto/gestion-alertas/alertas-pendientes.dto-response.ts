import type { TipoAlerta } from '../../../domain/results/seguimiento-individual';

/** Alerta pendiente de la bandeja (RF-146): solo seudónimo y datos de la alerta. */
export interface AlertaPendienteDtoResponse {
  id_alerta: string;
  tipo_alerta: TipoAlerta;
  fecha_generacion: string;
  codigo_participante: string;
}

/** Respuesta 200 de `GET /admin/cohortes/:id_cohorte/alertas/pendientes`. */
export interface AlertasPendientesDtoResponse {
  items: AlertaPendienteDtoResponse[];
  total: number;
  offset: number;
  limit: number;
}
