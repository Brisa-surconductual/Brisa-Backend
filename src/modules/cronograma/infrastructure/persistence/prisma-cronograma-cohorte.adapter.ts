import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { CronogramaPort } from '../../application/ports/cronograma.port';
import type { EstadoCronograma } from '../../domain/enums/estado-cronograma.enum';

@Injectable()
export class PrismaCronogramaCohorteAdapter implements CronogramaPort {
  async obtenerEstadoParaAsociar(
    tx: Prisma.TransactionClient,
    idCronograma: string,
  ): Promise<EstadoCronograma | null> {
    // Mantiene vigente el estado hasta confirmar la escritura de la cohorte.
    const [cronograma] = await tx.$queryRaw<{ estado: EstadoCronograma }[]>`
      SELECT estado::text AS estado
      FROM cronograma.cronogramas
      WHERE id_cronograma = ${idCronograma}::uuid
      FOR SHARE
    `;
    return cronograma?.estado ?? null;
  }
}
