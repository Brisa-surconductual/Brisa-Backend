import type { EstadoResolucionAlerta } from '../enums/estado-resolucion-alerta.enum';

/** Tipo de alerta generada por M05 (RF-63 craving elevado, RF-68 inactividad). */
export type TipoAlerta = 'CRAVING_ELEVADO' | 'INACTIVIDAD';

/** Requerimiento de M05 que generó la alerta. */
export type FuenteAlerta = 'RF-63' | 'RF-68';

/** Alerta con su estado de resolución ya resuelto por M-8 (RF-129). */
export interface AlertaResuelta {
  id_alerta: string;
  estado_resolucion: EstadoResolucionAlerta;
  fecha_resolucion: string | null;
}

export interface IndicadoresAdherencia {
  tasa_adherencia: number;
  dias_con_registro: number;
}

export interface IndicadoresProgreso {
  nivel_progreso: string;
  unidades_completadas: number;
}
