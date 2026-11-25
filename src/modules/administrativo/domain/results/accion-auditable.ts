import type { AccionAdministrativa } from '../enums/accion-administrativa.enum';
import type { EstadoAccion } from '../enums/estado-accion.enum';
import type { OperacionCohorte } from '../enums/operacion-cohorte.enum';
import type { OperacionParticipanteCohorte } from '../enums/operacion-participante-cohorte.enum';

/** Detalle adicional que acompaña a un registro de bitácora según la acción. */
export type DetalleAuditoria =
  | { metodo: string; uri: string }
  | { nombre_archivo: string | null; tamano_bytes: number | null }
  | { operacion: OperacionCohorte | OperacionParticipanteCohorte };

/** Qué se va a auditar, antes de conocer el resultado de la acción. */
export interface AccionAuditable {
  accion: AccionAdministrativa;
  recurso: string;
  idRecurso?: string | null;
  detalle?: DetalleAuditoria;
}

/** Acción auditable con el estado con el que terminó. */
export interface EventoAuditoria extends AccionAuditable {
  estado: EstadoAccion;
  idAuditoria?: string;
}
