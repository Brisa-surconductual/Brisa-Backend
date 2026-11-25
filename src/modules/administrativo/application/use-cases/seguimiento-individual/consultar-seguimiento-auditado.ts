import { HttpException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { AccionAdministrativa } from '../../../domain/enums/accion-administrativa.enum';
import type { RecursoAuditado } from '../../../domain/enums/recurso-auditado.enum';
import { SeveridadAuditoria } from '../../../domain/enums/severidad-auditoria.enum';
import type { SeguimientoIndividualRepository } from '../../../domain/repositories/seguimiento-individual.repository';
import type { AccionAuditable } from '../../../domain/results/accion-auditable';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import { SeguimientoIndividualException } from '../../exceptions/seguimiento-individual.exception';
import type { AuditoriaService } from '../../services/auditoria.service';
import { consultarFuenteConLimite } from '../../services/consultar-fuente-con-limite';

const M05_NO_DISPONIBLE = Symbol('m05-no-disponible');

export interface ConsultaSeguimiento<M, R> {
  recurso: RecursoAuditado;
  consulta: 'PERFIL_SEGUIMIENTO' | 'HISTORIAL_ALERTAS';
  /** Llamada a M05; null si no tiene datos del participante. */
  obtener: () => Promise<M | null>;
  /** Valida y enriquece la respuesta de M05; null si no hay nada que mostrar. */
  construir: (
    tx: Prisma.TransactionClient,
    datos: M,
    idParticipante: string,
  ) => Promise<R | null>;
}

/**
 * Esqueleto común de RF-128 y RF-129. Todo ocurre dentro de
 * `AuditoriaService.ejecutar`, de modo que:
 * - la consulta queda en la bitácora (CONSULTA_PARTICIPANTE, severidad ALTA) en
 *   la misma transacción; si esa escritura falla, responde 500 sin datos;
 * - un 404/409/503 se registra como FALLIDA con la misma severidad.
 */
export async function consultarSeguimientoAuditado<M, R>(
  auditoria: AuditoriaService,
  repositorio: SeguimientoIndividualRepository,
  ctx: ContextoAuditoria,
  codigoParticipante: string,
  consulta: ConsultaSeguimiento<M, R>,
): Promise<R | null> {
  const accion: AccionAuditable = {
    accion: AccionAdministrativa.CONSULTA_PARTICIPANTE,
    recurso: consulta.recurso,
    severidad: SeveridadAuditoria.ALTA,
    detalle: {
      consulta: consulta.consulta,
      codigo_participante: codigoParticipante,
    },
  };

  try {
    return await auditoria.ejecutar(ctx, accion, async (tx) => {
      const idParticipante = await repositorio.buscarIdParticipante(
        tx,
        codigoParticipante,
      );
      if (!idParticipante)
        throw new SeguimientoIndividualException('PARTICIPANTE_NO_ENCONTRADO');
      accion.idParticipante = idParticipante;

      const datos = await consultarFuenteConLimite<
        M | null | typeof M05_NO_DISPONIBLE
      >(consulta.obtener, M05_NO_DISPONIBLE);
      if (datos === M05_NO_DISPONIBLE)
        throw new SeguimientoIndividualException('M05_NO_DISPONIBLE');
      if (datos === null) return null;
      return consulta.construir(tx, datos, idParticipante);
    });
  } catch (error) {
    if (error instanceof HttpException) throw error;
    throw new SeguimientoIndividualException('ERROR_CONSULTA_SEGUIMIENTO', {
      cause: error,
    });
  }
}
