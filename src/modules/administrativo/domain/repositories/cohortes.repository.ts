import type { Prisma } from '@prisma/client';
import type { Cohorte, DatosCohorte } from '../entities/cohorte/cohorte.entity';
import type { CohorteConsultada } from '../results/cohorte-consultada';

export abstract class CohortesRepository {
  abstract consultarVigentes(
    tx: Prisma.TransactionClient,
    id?: string | readonly string[],
  ): Promise<CohorteConsultada[]>;

  abstract buscarParaActualizar(
    tx: Prisma.TransactionClient,
    id: string,
  ): Promise<Cohorte | null>;

  abstract crear(
    tx: Prisma.TransactionClient,
    id: string,
    datos: DatosCohorte,
    actor: string,
  ): Promise<Cohorte>;

  abstract actualizar(
    tx: Prisma.TransactionClient,
    cohorte: Cohorte,
    actor: string,
  ): Promise<Cohorte>;
}
