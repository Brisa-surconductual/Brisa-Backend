import type { AlcancePermiso } from '../enums/alcance-permiso.enum';

/** Datos con los que se persiste un permiso individual recién otorgado. */
export interface NuevoPermisoIndividual {
  id_permiso: string;
  id_usuario_beneficiario: string;
  id_participante: string;
  alcance: AlcancePermiso;
  fecha_fin_vigencia: Date | null;
  otorgado_por: string;
}
