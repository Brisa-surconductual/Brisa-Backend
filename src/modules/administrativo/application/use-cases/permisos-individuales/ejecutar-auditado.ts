import { HttpException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { AdministrativoDomainException } from '../../../domain/exceptions/domain.exception';
import type { AccionAuditable } from '../../../domain/results/accion-auditable';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import { PermisoIndividualException } from '../../exceptions/permiso-individual.exception';
import type { AuditoriaService } from '../../services/auditoria.service';

/**
 * Ejecuta una operación de permisos individuales con su auditoría síncrona y
 * traduce los errores de dominio al contrato HTTP de RF-04.
 */
export function ejecutarPermisoAuditado<T>(
  auditoria: AuditoriaService,
  ctx: ContextoAuditoria,
  accion: AccionAuditable,
  operacion: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return auditoria.ejecutar(ctx, accion, operacion).catch((error: unknown) => {
    if (error instanceof HttpException) throw error;
    if (error instanceof AdministrativoDomainException)
      throw PermisoIndividualException.desdeDominio(error);
    throw new PermisoIndividualException('ERROR_PERSISTENCIA_PERMISOS', {
      cause: error,
    });
  });
}
