import { EstadoCuenta } from '../../../usuarios/domain/enums/estado-cuenta';
import { Rol } from '../../../usuarios/domain/enums/rol.enum';
import { AsignacionModalidadVigente } from '../repositories/modalidad-programa.repository';

/**
 * Criterio provisional pendiente de confirmacion funcional.
 * El repositorio garantiza que las asignaciones son vigentes.
 */
export class PoliticaParticipanteActivoPrograma {
  esActivo(asignacion: AsignacionModalidadVigente): boolean {
    return (
      asignacion.rol === Rol.ESTUDIANTE &&
      asignacion.estadoCuenta === EstadoCuenta.ACTIVA
    );
  }

  filtrar(
    asignaciones: readonly AsignacionModalidadVigente[],
  ): AsignacionModalidadVigente[] {
    return asignaciones.filter((asignacion) =>
      this.esActivo(asignacion),
    );
  }
}
