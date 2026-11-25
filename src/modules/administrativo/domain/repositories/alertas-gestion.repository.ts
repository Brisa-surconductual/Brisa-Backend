import type { Prisma } from '@prisma/client';
import type { ContextoAuditoria } from '../results/contexto-auditoria';
import type { TipoAlerta } from '../results/seguimiento-individual';

export interface NuevaAtencionAlerta {
  id_alerta: string;
  tipo_alerta: TipoAlerta;
  id_participante: string;
  motivo: string;
}

/** Gestión administrativa en M-8 de las alertas generadas por M05 (RF-147). */
export abstract class AlertasGestionRepository {
  /**
   * Registra la alerta como ATENDIDA, con su motivo y su bitácora, en la misma
   * transacción (`administrativo.fn_atender_alerta`).
   */
  abstract registrarAtencion(
    tx: Prisma.TransactionClient,
    atencion: NuevaAtencionAlerta,
    actor: ContextoAuditoria,
  ): Promise<{ id_alerta_gestion: string; fecha_atencion: Date }>;
}
