import type { NivelProgreso } from '../enums/nivel-progreso.enum';
import type { FiltrosAgregados } from './filtros-agregados';

export const INDICADORES_COMPARACION = ['PROGRESO', 'ADHERENCIA'] as const;
export type IndicadorComparacion = (typeof INDICADORES_COMPARACION)[number];

export interface ConsultaComparacionCohortes {
  ids: string[];
  indicadores: IndicadorComparacion[];
  filtros: Pick<FiltrosAgregados, 'fecha_inicio' | 'fecha_fin'>;
  intentoExtraccion: boolean;
}

export interface CohorteComparada {
  id_cohorte: string;
  nombre_cohorte: string;
  n: number | null;
  suprimida: boolean;
  distribucion_niveles_progreso:
    { nivel: NivelProgreso; total: number | null }[] | null;
  tasa_adherencia_promedio: number | null;
  fecha_actualizacion: string | null;
}
