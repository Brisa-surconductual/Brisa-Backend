import type { TipoAlerta } from '../../../domain/results/seguimiento-individual';

/** Respuesta 200 de la acción "marcar como atendida" (RF-147). */
export interface AlertaAtendidaDtoResponse {
  id_alerta: string;
  tipo_alerta: TipoAlerta;
  estado_resolucion: 'ATENDIDA';
  fecha_resolucion: string;
  motivo: string;
}
