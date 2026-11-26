import type { NivelProgreso } from '../enums/nivel-progreso.enum';
import type { TipoAlerta } from './seguimiento-individual';

/**
 * Fila del listado de indicadores de una cohorte (RF-142). Solo seudónimo e
 * indicadores: nunca correo, texto de diario ni de chat.
 */
export interface IndicadoresParticipanteListado {
  codigo_participante: string;
  /** null si M05 aún no clasificó al participante. */
  nivel_progreso: NivelProgreso | null;
  /** null si M05 aún no calculó la adherencia. */
  tasa_adherencia: number | null;
  /** Alertas activas en M05 que nadie atendió en M-8. */
  alertas_activas: number;
  /** Alertas activas en M05 que el equipo ya marcó ATENDIDA en M-8 (RF-147). */
  alertas_atendidas: number;
  /** Tipos de las alertas no atendidas. */
  tipos_alerta_activa: TipoAlerta[];
}

/** Filtros tipados del listado; todos opcionales y combinables. */
export interface FiltrosListadoIndicadores {
  nivel_progreso?: NivelProgreso;
  adherencia_min?: number;
  adherencia_max?: number;
  /** true: con alertas sin atender; false: sin alertas sin atender. */
  con_alertas?: boolean;
}

export const CAMPOS_ORDEN_LISTADO = [
  'codigo_participante',
  'nivel_progreso',
  'tasa_adherencia',
  'alertas_activas',
  'alertas_atendidas',
] as const;

export type CampoOrdenListado = (typeof CAMPOS_ORDEN_LISTADO)[number];

export type DireccionOrden = 'ASC' | 'DESC';

export interface OrdenListadoIndicadores {
  campo: CampoOrdenListado;
  direccion: DireccionOrden;
}

export interface PaginaListado {
  offset: number;
  limit: number;
}
