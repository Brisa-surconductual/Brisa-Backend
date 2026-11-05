import { AsignacionModalidadVigente } from '../entities/modalidad/asignacion-modalidad-vigente';

/**
 * Criterio provisional pendiente de confirmacion funcional.
 * El repositorio garantiza que las asignaciones son vigentes.
 */
export class PoliticaParticipanteActivoPrograma {
  esActivo(asignacion: AsignacionModalidadVigente): boolean {
    return asignacion.esEstudiante && asignacion.cuentaActiva;
  }

  filtrar(
    asignaciones: readonly AsignacionModalidadVigente[],
  ): AsignacionModalidadVigente[] {
    return asignaciones.filter((asignacion) => this.esActivo(asignacion));
  }
}
