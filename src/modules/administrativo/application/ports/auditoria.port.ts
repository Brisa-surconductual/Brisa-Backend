import type { Prisma } from '@prisma/client';
import type { RegistroAuditoria } from '../../domain/entities/auditoria/registro-auditoria.entity';
import type { EntradaBitacora } from '../../domain/results/entrada-bitacora';

export abstract class BitacoraRepository {
  abstract enTransaccion<T>(
    operacion: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T>;
  abstract insertar(
    tx: Prisma.TransactionClient,
    registro: RegistroAuditoria,
    diferido: boolean,
  ): Promise<void>;
  abstract listar(
    tx: Prisma.TransactionClient,
    cursor: string | null,
    limite: number,
  ): Promise<EntradaBitacora[]>;
}

export abstract class ColaAuditoriaPort {
  abstract encolar(registro: RegistroAuditoria): Promise<void>;
}
