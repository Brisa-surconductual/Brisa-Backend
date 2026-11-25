import type { AlcancePermiso } from '../../enums/alcance-permiso.enum';
import { PermisoYaRevocadoException } from '../../exceptions/permiso-individual.exceptions';

export interface DatosPermisoIndividual {
  id_permiso: string;
  id_usuario_beneficiario: string;
  codigo_participante: string;
  alcance: AlcancePermiso;
  fecha_inicio_vigencia: Date;
  fecha_fin_vigencia: Date | null;
  revocado_en: Date | null;
}

/**
 * Permiso explícito de acceso individual (RF-04): un COORDINADOR_PSI lo otorga
 * a un ADMINISTRATIVO sobre un participante concreto.
 *
 * Regla de vigencia (la misma que `administrativo.fn_permiso_individual_vigente`):
 * no revocado, ya iniciado y sin fin, o con fin posterior a `ahora`.
 */
export class PermisoIndividual {
  constructor(private readonly datos: DatosPermisoIndividual) {}

  get id_permiso() {
    return this.datos.id_permiso;
  }
  get id_usuario_beneficiario() {
    return this.datos.id_usuario_beneficiario;
  }
  get codigo_participante() {
    return this.datos.codigo_participante;
  }
  get alcance() {
    return this.datos.alcance;
  }
  get fecha_inicio_vigencia() {
    return this.datos.fecha_inicio_vigencia;
  }
  get fecha_fin_vigencia() {
    return this.datos.fecha_fin_vigencia;
  }
  get revocado_en() {
    return this.datos.revocado_en;
  }

  estaVigente(ahora: Date): boolean {
    const instante = ahora.getTime();
    return (
      this.datos.revocado_en === null &&
      this.datos.fecha_inicio_vigencia.getTime() <= instante &&
      (this.datos.fecha_fin_vigencia === null ||
        this.datos.fecha_fin_vigencia.getTime() > instante)
    );
  }

  /** Comprueba que el permiso todavía admite revocación. */
  asegurarRevocable(): void {
    if (this.datos.revocado_en !== null) throw new PermisoYaRevocadoException();
  }
}
