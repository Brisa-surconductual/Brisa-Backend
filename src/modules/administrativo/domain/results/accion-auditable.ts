import type { AccionAdministrativa } from '../enums/accion-administrativa.enum';
import type { EstadoAccion } from '../enums/estado-accion.enum';
import type { OperacionCohorte } from '../enums/operacion-cohorte.enum';
import type { OperacionParticipanteCohorte } from '../enums/operacion-participante-cohorte.enum';
import type { OperacionPermisoIndividual } from '../enums/operacion-permiso-individual.enum';
import type { SeveridadAuditoria } from '../enums/severidad-auditoria.enum';

/** Detalle adicional que acompaña a un registro de bitácora según la acción. */
export type DetalleAuditoria =
  | { metodo: string; uri: string }
  | { nombre_archivo: string | null; tamano_bytes: number | null }
  | { operacion: OperacionCohorte | OperacionParticipanteCohorte }
  | {
      operacion: OperacionPermisoIndividual;
      alcance?: string;
      codigo_participante?: string;
      id_usuario_beneficiario?: string;
      fecha_fin_vigencia?: string | null;
    }
  | { motivo: string; alcance: string; uri: string }
  | {
      consulta: 'PERFIL_SEGUIMIENTO' | 'HISTORIAL_ALERTAS';
      codigo_participante: string;
    }
  | {
      operacion: 'MARCAR_ATENDIDA';
      id_alerta: string;
      codigo_participante: string;
    };

/** Qué se va a auditar, antes de conocer el resultado de la acción. */
export interface AccionAuditable {
  accion: AccionAdministrativa;
  recurso: string;
  idRecurso?: string | null;
  detalle?: DetalleAuditoria;
  /** Por omisión la bitácora registra BAJA. */
  severidad?: SeveridadAuditoria;
  /** Participante afectado (UUID interno), cuando la acción recae sobre uno. */
  idParticipante?: string | null;
}

/** Acción auditable con el estado con el que terminó. */
export interface EventoAuditoria extends AccionAuditable {
  estado: EstadoAccion;
  idAuditoria?: string;
}
