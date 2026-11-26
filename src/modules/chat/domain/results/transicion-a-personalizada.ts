import { AsignacionModalidad } from '../entities/modalidad/asignacion-modalidad.entity';

/** Resultado de habilitar la modalidad personalizada: la asignación grupal que se cierra y la nueva. */
export interface TransicionAPersonalizada {
  readonly cerrada: AsignacionModalidad;
  readonly nueva: AsignacionModalidad;
}
