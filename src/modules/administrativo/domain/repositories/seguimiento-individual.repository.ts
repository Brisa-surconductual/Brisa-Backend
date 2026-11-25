import type { Prisma } from '@prisma/client';

/** Datos locales de M-8 que complementan el seguimiento individual de M05. */
export abstract class SeguimientoIndividualRepository {
  /** UUID interno del estudiante con ese seudónimo, o null si no existe. */
  abstract buscarIdParticipante(
    tx: Prisma.TransactionClient,
    codigo: string,
  ): Promise<string | null>;

  /**
   * Alertas de M05 de ese participante marcadas como ATENDIDA en
   * `alertas_gestion_admin` (RF-147), con su fecha de atención.
   */
  abstract buscarAlertasAtendidas(
    tx: Prisma.TransactionClient,
    idParticipante: string,
    idsAlerta: string[],
  ): Promise<Map<string, Date>>;

  /**
   * RF-142: de esas alertas, las marcadas ATENDIDA en `alertas_gestion_admin`
   * para cualquiera de esos participantes, en una sola consulta. Devuelve las
   * claves `id_participante:id_alerta` en minúsculas.
   */
  abstract buscarAlertasAtendidasLote(
    tx: Prisma.TransactionClient,
    idsParticipante: string[],
    idsAlerta: string[],
  ): Promise<Set<string>>;
}
