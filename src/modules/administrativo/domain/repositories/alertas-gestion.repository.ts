import type { Prisma } from '@prisma/client';
import type { ContextoAuditoria } from '../results/contexto-auditoria';
import type { TipoAlerta } from '../results/seguimiento-individual';

export interface NuevaAtencionAlerta {
  id_alerta: string;
  tipo_alerta: TipoAlerta;
  id_participante: string;
  motivo: string;
}

/** Gestión administrativa en M-8 de las alertas generadas por M05 (RF-146, RF-147). */
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

  /**
   * RF-146: de esas alertas de M05, las que **no** tienen registro en
   * `alertas_gestion_admin` (anti-join por lote, una sola consulta). Devuelve
   * los ids en minúsculas.
   */
  abstract filtrarNoAtendidas(
    tx: Prisma.TransactionClient,
    idsAlerta: string[],
  ): Promise<Set<string>>;
}
