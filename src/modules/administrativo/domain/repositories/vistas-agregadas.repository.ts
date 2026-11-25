import type { Prisma } from '@prisma/client';
import type { TipoVistaAgregada } from '../../domain/enums/tipo-vista-agregada.enum';
import type { DatosVistaAgregada } from '../../domain/results/vista-agregada';

export abstract class VistasAgregadasRepository {
  abstract identificarCohortesActivas(
    tx?: Prisma.TransactionClient,
  ): Promise<string[]>;

  abstract obtenerCronogramaCohorteActiva(
    tx: Prisma.TransactionClient,
    idCohorte: string,
  ): Promise<string | null>;
  abstract obtenerUltimo(
    tx: Prisma.TransactionClient,
    idCohorte: string,
    vista: TipoVistaAgregada,
  ): Promise<unknown>;
  abstract guardar(
    tx: Prisma.TransactionClient,
    idCohorte: string,
    vista: TipoVistaAgregada,
    datos: DatosVistaAgregada,
  ): Promise<boolean>;
  abstract suprimir(
    tx: Prisma.TransactionClient,
    idCohorte: string,
    vista: TipoVistaAgregada,
  ): Promise<void>;
}
