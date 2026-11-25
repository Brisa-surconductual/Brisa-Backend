import { HttpException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { AccionAdministrativa } from '../../../domain/enums/accion-administrativa.enum';
import type { RecursoAuditado } from '../../../domain/enums/recurso-auditado.enum';
import { SeveridadAuditoria } from '../../../domain/enums/severidad-auditoria.enum';
import type { SeguimientoIndividualRepository } from '../../../domain/repositories/seguimiento-individual.repository';
import type {
  AccionAuditable,
  ConsultaIndividual,
} from '../../../domain/results/accion-auditable';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import {
  type CodigoErrorSeguimientoIndividual,
  SeguimientoIndividualException,
} from '../../exceptions/seguimiento-individual.exception';
import type { AuditoriaService } from '../../services/auditoria.service';
import { consultarFuenteConLimite } from '../../services/consultar-fuente-con-limite';

const FUENTE_NO_DISPONIBLE = Symbol('fuente-no-disponible');

/** Módulo que expone los datos individuales del participante. */
export type FuenteIndividual = 'M05' | 'M06' | 'M07';

const ERRORES_POR_FUENTE: Record<
  FuenteIndividual,
  {
    noDisponible: CodigoErrorSeguimientoIndividual;
    errorCarga: CodigoErrorSeguimientoIndividual;
  }
> = {
  M05: {
    noDisponible: 'M05_NO_DISPONIBLE',
    errorCarga: 'ERROR_CONSULTA_SEGUIMIENTO',
  },
  M06: {
    noDisponible: 'M06_NO_DISPONIBLE',
    errorCarga: 'ERROR_CONSULTA_NARRATIVA',
  },
  M07: {
    noDisponible: 'M07_NO_DISPONIBLE',
    errorCarga: 'ERROR_CONSULTA_NOTIFICACIONES',
  },
};

export interface ConsultaSeguimiento<M, R> {
  fuente: FuenteIndividual;
  recurso: RecursoAuditado;
  consulta: ConsultaIndividual;
  /** Datos extra para el detalle de la bitácora (p. ej. el periodo de RF-131). */
  detalle?: { fecha_inicio?: string | null; fecha_fin?: string | null };
  /** Llamada al módulo fuente; null si no tiene datos del participante. */
  obtener: (idParticipante: string) => Promise<M | null>;
  /** Valida y arma la respuesta; null si no hay nada que mostrar (204). */
  construir: (
    tx: Prisma.TransactionClient,
    datos: M,
    idParticipante: string,
  ) => Promise<R | null> | R | null;
}

/**
 * Esqueleto común de las consultas individuales (RF-128 a RF-131). Todo ocurre
 * dentro de `AuditoriaService.ejecutar`, de modo que:
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
  const errores = ERRORES_POR_FUENTE[consulta.fuente];
  const accion: AccionAuditable = {
    accion: AccionAdministrativa.CONSULTA_PARTICIPANTE,
    recurso: consulta.recurso,
    severidad: SeveridadAuditoria.ALTA,
    detalle: {
      consulta: consulta.consulta,
      codigo_participante: codigoParticipante,
      ...consulta.detalle,
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
        M | null | typeof FUENTE_NO_DISPONIBLE
      >(() => consulta.obtener(idParticipante), FUENTE_NO_DISPONIBLE);
      if (datos === FUENTE_NO_DISPONIBLE)
        throw new SeguimientoIndividualException(errores.noDisponible);
      if (datos === null) return null;
      return consulta.construir(tx, datos, idParticipante);
    });
  } catch (error) {
    if (error instanceof HttpException) throw error;
    throw new SeguimientoIndividualException(errores.errorCarga, {
      cause: error,
    });
  }
}
