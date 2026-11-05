import { AsignacionModalidad } from '../entities/modalidad/asignacion-modalidad.entity';
import { AsignacionModalidadVigente } from '../entities/modalidad/asignacion-modalidad-vigente';

export abstract class ModalidadProgramaRepository {
  abstract listarAsignacionesVigentesPorPrograma(
    idPrograma: number,
  ): Promise<AsignacionModalidadVigente[]>;

  /**
   * Persiste las asignaciones de forma atomica. Una asignacion cerrada debe
   * seguir vigente en el almacenamiento; si no lo esta, lanza
   * TransicionConcurrenteException.
   */
  abstract guardarAsignaciones(
    asignaciones: readonly AsignacionModalidad[],
  ): Promise<void>;
}
