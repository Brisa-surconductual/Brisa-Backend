import type { Prisma } from '@prisma/client';
import type { DatosConductuales } from '../../domain/vista-conductual';

export abstract class VistasConductualesRepository {
  abstract bloquearCohorteActiva(
    tx: Prisma.TransactionClient,
    idCohorte: string,
  ): Promise<boolean>;
  abstract obtenerUltimo(
    tx: Prisma.TransactionClient,
    idCohorte: string,
  ): Promise<unknown>;
  abstract guardar(
    tx: Prisma.TransactionClient,
    idCohorte: string,
    datos: DatosConductuales,
  ): Promise<boolean>;
  abstract suprimir(
    tx: Prisma.TransactionClient,
    idCohorte: string,
  ): Promise<void>;
}
