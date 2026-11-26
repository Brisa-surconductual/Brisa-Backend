/** Filtro y paginación del listado de permisos individuales (RF-04). */
export interface FiltroPermisosIndividuales {
  codigo_participante?: string;
  solo_vigentes: boolean;
  offset: number;
  limit: number;
}
