import type { AccionAdministrativa } from '../../enums/accion-administrativa.enum';
import type { EstadoAccion } from '../../enums/estado-accion.enum';
import type { DetalleAuditoria } from '../../results/accion-auditable';
import type { ContextoAuditoria } from '../../results/contexto-auditoria';

/** Registro inmutable de la bitácora de auditoría administrativa (RF-123). */
export interface RegistroAuditoria extends ContextoAuditoria {
  id_auditoria: string;
  accion: AccionAdministrativa;
  recurso_afectado: string;
  id_recurso: string | null;
  marca_temporal: string;
  estado_accion: EstadoAccion;
  detalle?: DetalleAuditoria;
}
