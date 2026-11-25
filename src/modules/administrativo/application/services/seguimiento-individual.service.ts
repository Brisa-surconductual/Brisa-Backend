import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  EstadoResolucionAlerta,
  type EstadoResolucionAlerta as TipoEstadoResolucion,
} from '../../domain/enums/estado-resolucion-alerta.enum';
import { SeguimientoIndividualRepository } from '../../domain/repositories/seguimiento-individual.repository';
import type { TipoAlerta } from '../../domain/results/seguimiento-individual';
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

/** Alerta activa que M05 informa en la consulta por lote (RF-142). */
export interface AlertaActivaLote {
  id_alerta: string;
  tipo_alerta: TipoAlerta;
  estado_resolucion?: TipoEstadoResolucion | null;
}

/** Alertas de un participante separadas según si M-8 ya las atendió. */
export interface AlertasClasificadas {
  no_atendidas: AlertaActivaLote[];
  atendidas: AlertaActivaLote[];
}

/** Estados de M05 que mantienen una alerta abierta (null = ACTIVA). */
const ESTADOS_ABIERTOS: ReadonlySet<TipoEstadoResolucion> = new Set([
  EstadoResolucionAlerta.ACTIVA,
  EstadoResolucionAlerta.PENDIENTE,
  EstadoResolucionAlerta.EN_REVISION,
]);

/**
 * Reglas compartidas del seguimiento individual (RF-128, RF-129, RF-142):
 * aislamiento por participante y estado de resolución de las alertas.
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
   * RF-142: separa, para muchos participantes a la vez, las alertas abiertas
   * en M05 entre no atendidas y atendidas en M-8 (RF-147), con una sola
   * consulta a `alertas_gestion_admin`. Las cerradas en M05 se descartan.
   */
  async clasificarAlertasLote(
    tx: Prisma.TransactionClient,
    participantes: { id_participante: string; alertas: AlertaActivaLote[] }[],
  ): Promise<Map<string, AlertasClasificadas>> {
    const abiertas = participantes.map(({ id_participante, alertas }) => ({
      id_participante,
      alertas: alertas.filter(
        (alerta) =>
          alerta.estado_resolucion == null ||
          ESTADOS_ABIERTOS.has(alerta.estado_resolucion),
      ),
    }));
    const idsAlerta = abiertas.flatMap(({ alertas }) =>
      alertas.map((alerta) => alerta.id_alerta),
    );
    const atendidas = idsAlerta.length
      ? await this.repositorio.buscarAlertasAtendidasLote(
          tx,
          abiertas.map(({ id_participante }) => id_participante),
          idsAlerta,
        )
      : new Set<string>();

    return new Map(
      abiertas.map(({ id_participante, alertas }) => {
        const clasificadas: AlertasClasificadas = {
          no_atendidas: [],
          atendidas: [],
        };
        for (const alerta of alertas) {
          const clave = `${id_participante.toLowerCase()}:${alerta.id_alerta.toLowerCase()}`;
          (atendidas.has(clave)
            ? clasificadas.atendidas
            : clasificadas.no_atendidas
          ).push(alerta);
        }
        return [id_participante, clasificadas];
      }),
    );
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
