import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  EstadoResolucionAlerta,
  type EstadoResolucionAlerta as TipoEstadoResolucion,
} from '../../domain/enums/estado-resolucion-alerta.enum';
import { SeguimientoIndividualRepository } from '../../domain/repositories/seguimiento-individual.repository';
import { SeguimientoIndividualException } from '../exceptions/seguimiento-individual.exception';

/** Lo mínimo que M05 informa de una alerta para resolver su estado. */
export interface AlertaPorResolver {
  id_alerta: string;
  estado_resolucion?: TipoEstadoResolucion | null;
  fecha_resolucion?: string | null;
}

export type AlertaConEstado<T extends AlertaPorResolver> = Omit<
  T,
  'estado_resolucion' | 'fecha_resolucion'
> & {
  estado_resolucion: TipoEstadoResolucion;
  fecha_resolucion: string | null;
};

/**
 * Reglas compartidas del seguimiento individual (RF-128, RF-129): aislamiento
 * por participante y estado de resolución de las alertas.
 */
@Injectable()
export class SeguimientoIndividualService {
  constructor(private readonly repositorio: SeguimientoIndividualRepository) {}

  /** ¿Ya se atendió en M-8 esta alerta del participante? (RF-147) */
  async estaAtendida(
    tx: Prisma.TransactionClient,
    idParticipante: string,
    idAlerta: string,
  ): Promise<boolean> {
    const atendidas = await this.repositorio.buscarAlertasAtendidas(
      tx,
      idParticipante,
      [idAlerta],
    );
    return atendidas.has(idAlerta);
  }

  /**
   * Bloquea la vista si el módulo fuente devolvió datos de otro participante
   * (409). Compara el código de M05 o el `id_usuario` de M06 / M07, sin
   * distinguir mayúsculas (los UUID pueden llegar en cualquiera de las dos).
   */
  validarPertenencia(idRespuesta: string, idSolicitado: string): void {
    if (
      typeof idRespuesta !== 'string' ||
      idRespuesta.toLowerCase() !== idSolicitado.toLowerCase()
    )
      throw new SeguimientoIndividualException('INCONSISTENCIA_PARTICIPANTE');
  }

  /**
   * Prioridad del estado de resolución:
   * 1. ATENDIDA si la alerta figura en `alertas_gestion_admin` (RF-147);
   * 2. el estado que informa M05;
   * 3. ACTIVA si M05 no informa ninguno.
   */
  async resolverEstados<T extends AlertaPorResolver>(
    tx: Prisma.TransactionClient,
    idParticipante: string,
    alertas: T[],
  ): Promise<AlertaConEstado<T>[]> {
    const atendidas = alertas.length
      ? await this.repositorio.buscarAlertasAtendidas(
          tx,
          idParticipante,
          alertas.map((alerta) => alerta.id_alerta),
        )
      : new Map<string, Date>();

    return alertas.map((alerta) => {
      const atendida = atendidas.get(alerta.id_alerta);
      if (atendida)
        return {
          ...alerta,
          estado_resolucion: EstadoResolucionAlerta.ATENDIDA,
          fecha_resolucion: atendida.toISOString(),
        };
      return {
        ...alerta,
        estado_resolucion:
          alerta.estado_resolucion ?? EstadoResolucionAlerta.ACTIVA,
        fecha_resolucion: alerta.fecha_resolucion ?? null,
      };
    });
  }
}
