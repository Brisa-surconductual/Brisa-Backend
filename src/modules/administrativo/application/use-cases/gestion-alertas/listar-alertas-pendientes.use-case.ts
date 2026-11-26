import { HttpException, Injectable, Logger } from '@nestjs/common';
import { AccionAdministrativa } from '../../../domain/enums/accion-administrativa.enum';
import { EstadoResolucionAlerta } from '../../../domain/enums/estado-resolucion-alerta.enum';
import { RecursoAuditado } from '../../../domain/enums/recurso-auditado.enum';
import { SeveridadAuditoria } from '../../../domain/enums/severidad-auditoria.enum';
import { paginar } from '../../../domain/policies/listado-indicadores.policy';
import { AlertasGestionRepository } from '../../../domain/repositories/alertas-gestion.repository';
import { ParticipantesCohorteRepository } from '../../../domain/repositories/participantes-cohorte.repository';
import type { AccionAuditable } from '../../../domain/results/accion-auditable';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import type { TipoAlerta } from '../../../domain/results/seguimiento-individual';
import type {
  AlertaPendienteDtoResponse,
  AlertasPendientesDtoResponse,
} from '../../dto/gestion-alertas/alertas-pendientes.dto-response';
import { GestionAlertaException } from '../../exceptions/gestion-alerta.exception';
import {
  type AlertaActivaParticipanteM05,
  SeguimientoIndividualPort,
} from '../../ports/seguimiento-individual.port';
import { AuditoriaService } from '../../services/auditoria.service';
import { consultarFuenteConLimite } from '../../services/consultar-fuente-con-limite';

const M05_NO_DISPONIBLE = Symbol('m05-no-disponible');

/** Estados de M05 en los que una alerta sigue pendiente (null = ACTIVA). */
const ESTADOS_PENDIENTES = new Set<string>([
  EstadoResolucionAlerta.ACTIVA,
  EstadoResolucionAlerta.PENDIENTE,
]);

export interface ConsultaAlertasPendientes {
  tipo_alerta?: TipoAlerta;
  offset: number;
  limit: number;
}

/**
 * RF-146: bandeja de alertas pendientes de una cohorte. Toma de M05 las
 * alertas abiertas de los participantes ACTIVO y excluye las ya atendidas en
 * M-8 con un anti-join por lote contra `alertas_gestion_admin`.
 *
 * Sin N+1: una consulta de membresías, una llamada por lote a M05 y una
 * consulta de anti-join. Devuelve null (204) si no hay nada pendiente.
 */
@Injectable()
export class ListarAlertasPendientesUseCase {
  private readonly logger = new Logger(ListarAlertasPendientesUseCase.name);

  constructor(
    private readonly participantesCohorte: ParticipantesCohorteRepository,
    private readonly seguimiento: SeguimientoIndividualPort,
    private readonly alertas: AlertasGestionRepository,
    private readonly auditoria: AuditoriaService,
  ) {}

  async execute(
    ctx: ContextoAuditoria,
    idCohorte: string,
    consulta: ConsultaAlertasPendientes,
  ): Promise<AlertasPendientesDtoResponse | null> {
    const accion: AccionAuditable = {
      accion: AccionAdministrativa.CONSULTA_AGREGADA,
      recurso: RecursoAuditado.ALERTAS_PENDIENTES_COHORTE,
      idRecurso: idCohorte,
      severidad: SeveridadAuditoria.MEDIA,
      detalle: {
        consulta: 'ALERTAS_PENDIENTES',
        filtros: {
          ...(consulta.tipo_alerta && { tipo_alerta: consulta.tipo_alerta }),
          offset: consulta.offset,
          limit: consulta.limit,
        },
      },
    };

    try {
      return await this.auditoria.ejecutar(ctx, accion, async (tx) => {
        const estado = await this.participantesCohorte.estadoCohorte(
          tx,
          idCohorte,
          false,
        );
        if (!estado) throw new GestionAlertaException('COHORTE_NO_ENCONTRADA');

        const miembros = await this.participantesCohorte.listarActivos(
          tx,
          idCohorte,
        );
        if (miembros.length === 0) return null;
        const codigos = miembros.map((m) => m.codigo_participante);

        const lote = await consultarFuenteConLimite<
          AlertaActivaParticipanteM05[] | typeof M05_NO_DISPONIBLE
        >(
          () => this.seguimiento.obtenerAlertasActivasLote(codigos),
          M05_NO_DISPONIBLE,
        );
        if (lote === M05_NO_DISPONIBLE)
          throw new GestionAlertaException('M05_NO_DISPONIBLE');

        const candidatas = this.abiertasDeLaCohorte(lote, codigos).filter(
          (alerta) =>
            !consulta.tipo_alerta ||
            alerta.tipo_alerta === consulta.tipo_alerta,
        );
        const noAtendidas = candidatas.length
          ? await this.alertas.filtrarNoAtendidas(
              tx,
              candidatas.map((alerta) => alerta.id_alerta),
            )
          : new Set<string>();

        // Lista blanca explícita; la más antigua primero para que ninguna quede enterrada.
        const pendientes: AlertaPendienteDtoResponse[] = candidatas
          .filter((alerta) => noAtendidas.has(alerta.id_alerta.toLowerCase()))
          .map(
            ({
              id_alerta,
              tipo_alerta,
              fecha_generacion,
              codigo_participante,
            }) => ({
              id_alerta,
              tipo_alerta,
              fecha_generacion,
              codigo_participante,
            }),
          )
          .sort(
            (a, b) =>
              a.fecha_generacion.localeCompare(b.fecha_generacion) ||
              a.id_alerta.localeCompare(b.id_alerta),
          );

        const { items, total } = paginar(pendientes, consulta);
        if (total === 0) return null;
        return { items, total, offset: consulta.offset, limit: consulta.limit };
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new GestionAlertaException('ERROR_TRANSACCION', { cause: error });
    }
  }

  /**
   * Aislamiento por cohorte: solo alertas de participantes pedidos, una vez
   * cada una, y que sigan abiertas en M05 (ACTIVA / PENDIENTE).
   */
  private abiertasDeLaCohorte(
    lote: AlertaActivaParticipanteM05[],
    codigos: string[],
  ): AlertaActivaParticipanteM05[] {
    const cohorte = new Set(codigos);
    const vistas = new Set<string>();
    let ajenas = 0;
    const abiertas = lote.filter((alerta) => {
      if (!cohorte.has(alerta.codigo_participante)) {
        ajenas++;
        return false;
      }
      const id = alerta.id_alerta.toLowerCase();
      if (vistas.has(id)) return false;
      vistas.add(id);
      return (
        alerta.estado_resolucion == null ||
        ESTADOS_PENDIENTES.has(alerta.estado_resolucion)
      );
    });
    if (ajenas > 0)
      this.logger.warn(
        `M05 devolvió ${ajenas} alerta(s) de participantes fuera de la cohorte; se descartaron.`,
      );
    return abiertas;
  }
}
