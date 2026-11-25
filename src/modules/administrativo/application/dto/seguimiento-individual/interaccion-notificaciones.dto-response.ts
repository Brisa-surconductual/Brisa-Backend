import type { TasaPresentable } from '../../../domain/policies/tasa-notificacion.policy';
import type { PeriodoNotificaciones } from '../../ports/notificaciones-individual.port';
import type { MODO_SOLO_LECTURA } from './seguimiento-individual.dto-response';

/** Respuesta 200 de `GET /admin/participantes/:codigo/interaccion-notificaciones` (RF-131). */
export interface InteraccionNotificacionesDtoResponse {
  codigo_participante: string;
  /** El periodo solicitado; null = sin límite (todo el programa). */
  periodo: PeriodoNotificaciones;
  total_notificaciones_enviadas: number;
  total_notificaciones_entregadas: number;
  total_notificaciones_abiertas: number;
  total_notificaciones_descartadas: number;
  total_sesiones_desde_notificacion: number;
  tasa_apertura: TasaPresentable;
  tasa_conversion: TasaPresentable;
  tasa_descarte: TasaPresentable;
  modo_consulta: typeof MODO_SOLO_LECTURA;
}
