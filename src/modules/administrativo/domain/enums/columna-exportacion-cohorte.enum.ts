/** Lista blanca y orden de columnas del CSV agregado de cohorte (RF-144). */
export const COLUMNAS_EXPORTACION_COHORTE = [
  'nombre_cohorte',
  'estado_vista_conductual',
  'fecha_actualizacion_conductual',
  'total_usuarios_activos',
  'usuarios_nivel_inicial',
  'usuarios_nivel_en_avance',
  'usuarios_nivel_avanzado',
  'usuarios_nivel_completado',
  'tasa_adherencia_promedio',
  'alertas_inactividad_pendientes',
  'alertas_craving_pendientes',
  'estado_vista_notificaciones',
  'fecha_actualizacion_notificaciones',
  'tasa_apertura_promedio',
  'tasa_conversion_promedio',
  'total_notificaciones_enviadas',
  'total_notificaciones_entregadas',
  'total_notificaciones_descartadas',
] as const;

export type ColumnaExportacionCohorte =
  (typeof COLUMNAS_EXPORTACION_COHORTE)[number];
