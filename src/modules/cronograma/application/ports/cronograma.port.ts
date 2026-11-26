import type { Prisma } from '@prisma/client';
import type { EstadoCronograma } from '../../domain/enums/estado-cronograma.enum';

export abstract class CronogramaPort {
  abstract obtenerEstadoParaAsociar(
    tx: Prisma.TransactionClient,
    idCronograma: string,
  ): Promise<EstadoCronograma | null>;

  abstract listarIdsUnidadesEnOrden(
    tx: Prisma.TransactionClient,
    idCronograma: string,
  ): Promise<string[]>;
}
