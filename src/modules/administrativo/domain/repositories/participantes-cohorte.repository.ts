import type { Prisma } from '@prisma/client';
import type { ParticipanteCohorte } from '../entities/participante-cohorte/participante-cohorte.entity';
import type { EstadoCohorte } from '../enums/estado-cohorte.enum';
import type { ContextoAuditoria } from '../results/contexto-auditoria';

export abstract class ParticipantesCohorteRepository {
  abstract estadoCohorte(
    tx: Prisma.TransactionClient,
    cohorte: string,
    bloquear: boolean,
  ): Promise<EstadoCohorte | null>;

  abstract listar(
    tx: Prisma.TransactionClient,
    cohorte: string,
    codigos?: string[],
  ): Promise<ParticipanteCohorte[]>;

  abstract listarElegibles(
    tx: Prisma.TransactionClient,
    cohorte: string,
  ): Promise<{ codigo_participante: string }[]>;

  abstract asignar(
    tx: Prisma.TransactionClient,
    cohorte: string,
    codigos: string[],
    actor: ContextoAuditoria,
  ): Promise<ParticipanteCohorte[]>;

  abstract retirar(
    tx: Prisma.TransactionClient,
    cohorte: string,
    codigo: string,
    actor: ContextoAuditoria,
  ): Promise<ParticipanteCohorte>;
}
