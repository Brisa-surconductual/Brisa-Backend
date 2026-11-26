import type { PermisoIndividual } from '../../../domain/entities/permiso-individual/permiso-individual.entity';
import type { AlcancePermiso } from '../../../domain/enums/alcance-permiso.enum';

/** Respuesta 201 de `POST /admin/permisos-individuales`. */
export interface PermisoOtorgadoDtoResponse {
  id_permiso: string;
  codigo_participante: string;
  alcance: AlcancePermiso;
  fecha_inicio_vigencia: string;
  fecha_fin_vigencia: string | null;
  vigente: boolean;
}

/** Elemento del listado `GET /admin/permisos-individuales`. */
export interface PermisoListadoDtoResponse extends PermisoOtorgadoDtoResponse {
  id_usuario_beneficiario: string;
  /** Etiqueta del beneficiario: su correo electrónico (no hay nombre en la base). */
  correo_beneficiario: string;
  revocado_en: string | null;
}

export interface ListadoPermisosDtoResponse {
  items: PermisoListadoDtoResponse[];
  total: number;
  offset: number;
  limit: number;
}

/** Elemento de `GET /admin/permisos-individuales/beneficiarios` (BE-336). */
export interface BeneficiarioPermisoDtoResponse {
  id_usuario: string;
  correo_electronico: string;
}

export interface ListadoBeneficiariosDtoResponse {
  items: BeneficiarioPermisoDtoResponse[];
  total: number;
  offset: number;
  limit: number;
}

/** Respuesta 200 de `POST /admin/permisos-individuales/:id_permiso/revocar`. */
export interface PermisoRevocadoDtoResponse {
  id_permiso: string;
  vigente: false;
  revocado_en: string;
}

const iso = (fecha: Date | null) => (fecha ? fecha.toISOString() : null);

export function aPermisoOtorgado(
  permiso: PermisoIndividual,
  ahora: Date,
): PermisoOtorgadoDtoResponse {
  return {
    id_permiso: permiso.id_permiso,
    codigo_participante: permiso.codigo_participante,
    alcance: permiso.alcance,
    fecha_inicio_vigencia: permiso.fecha_inicio_vigencia.toISOString(),
    fecha_fin_vigencia: iso(permiso.fecha_fin_vigencia),
    vigente: permiso.estaVigente(ahora),
  };
}

export function aPermisoListado(
  permiso: PermisoIndividual,
  ahora: Date,
  correoBeneficiario: string,
): PermisoListadoDtoResponse {
  return {
    ...aPermisoOtorgado(permiso, ahora),
    id_usuario_beneficiario: permiso.id_usuario_beneficiario,
    correo_beneficiario: correoBeneficiario,
    revocado_en: iso(permiso.revocado_en),
  };
}
