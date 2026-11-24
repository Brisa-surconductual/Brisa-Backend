import type { Prisma } from '@prisma/client';
import type {
  DatosVistaAgregada,
  TipoVistaAgregada,
} from '../../domain/vista-agregada';

export abstract class VistasAgregadasRepository {
  abstract bloquearCohorteActiva(
    tx: Prisma.TransactionClient,
    idCohorte: string,
  ): Promise<boolean>;
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
