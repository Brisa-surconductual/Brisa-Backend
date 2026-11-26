/** Series temporales de la cohorte activa, alineadas por unidad (RF-141). */
export interface EvolucionTemporal {
  id_cohorte: string;
  serie_unidades_temporales: string[];
  serie_adherencia_promedio: (number | null)[];
  serie_nivel_progreso_distribucion: Record<string, number>[];
  serie_craving_promedio: (number | null)[];
  unidades_con_datos_insuficientes: string[];
  fecha_actualizacion: string;
  mensaje?: string;
}
