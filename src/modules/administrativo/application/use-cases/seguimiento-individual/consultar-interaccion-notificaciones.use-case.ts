import { Injectable } from '@nestjs/common';
import { RecursoAuditado } from '../../../domain/enums/recurso-auditado.enum';
import { tasaPresentable } from '../../../domain/policies/tasa-notificacion.policy';
import { SeguimientoIndividualRepository } from '../../../domain/repositories/seguimiento-individual.repository';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import type { InteraccionNotificacionesDtoResponse } from '../../dto/seguimiento-individual/interaccion-notificaciones.dto-response';
import { MODO_SOLO_LECTURA } from '../../dto/seguimiento-individual/seguimiento-individual.dto-response';
import {
  type InteraccionNotificacionesM07,
  NotificacionesIndividualPort,
  type PeriodoNotificaciones,
} from '../../ports/notificaciones-individual.port';
import { AuditoriaService } from '../../services/auditoria.service';
import { SeguimientoIndividualService } from '../../services/seguimiento-individual.service';
import { consultarSeguimientoAuditado } from './consultar-seguimiento-auditado';

/**
 * RF-131: interacción de un participante con las notificaciones en el periodo
 * consultado, en solo lectura. Presenta los totales y las tasas que calcula
 * M07 (RF-100) sin recalcularlas; las que no se pueden calcular salen como
 * NO_CALCULABLE con 200.
 *
 * Devuelve null (204) si M07 no tiene historial del participante o si no se le
 * envió ninguna notificación en el periodo.
 */
@Injectable()
export class ConsultarInteraccionNotificacionesUseCase {
  constructor(
    private readonly notificaciones: NotificacionesIndividualPort,
    private readonly reglas: SeguimientoIndividualService,
    private readonly repositorio: SeguimientoIndividualRepository,
    private readonly auditoria: AuditoriaService,
  ) {}

  execute(
    ctx: ContextoAuditoria,
    codigoParticipante: string,
    periodo: PeriodoNotificaciones,
  ): Promise<InteraccionNotificacionesDtoResponse | null> {
    return consultarSeguimientoAuditado<
      InteraccionNotificacionesM07,
      InteraccionNotificacionesDtoResponse
    >(this.auditoria, this.repositorio, ctx, codigoParticipante, {
      fuente: 'M07',
      recurso: RecursoAuditado.INTERACCION_NOTIFICACIONES_PARTICIPANTE,
      consulta: 'INTERACCION_NOTIFICACIONES',
      detalle: periodo,
      obtener: (idParticipante) =>
        this.notificaciones.obtenerInteraccion(idParticipante, periodo),
      construir: (_tx, interaccion, idParticipante) => {
        // Aislamiento por participante: M07 debe responder por el mismo usuario.
        this.reglas.validarPertenencia(interaccion.id_usuario, idParticipante);
        if (interaccion.total_notificaciones_enviadas <= 0) return null;

        const entregadas = interaccion.total_notificaciones_entregadas;
        const abiertas = interaccion.total_notificaciones_abiertas;
        return {
          codigo_participante: codigoParticipante,
          periodo: {
            fecha_inicio: periodo.fecha_inicio,
            fecha_fin: periodo.fecha_fin,
          },
          total_notificaciones_enviadas:
            interaccion.total_notificaciones_enviadas,
          total_notificaciones_entregadas: entregadas,
          total_notificaciones_abiertas: abiertas,
          total_notificaciones_descartadas:
            interaccion.total_notificaciones_descartadas,
          total_sesiones_desde_notificacion:
            interaccion.total_sesiones_desde_notificacion,
          tasa_apertura: tasaPresentable(interaccion.tasa_apertura, entregadas),
          tasa_conversion: tasaPresentable(
            interaccion.tasa_conversion,
            abiertas,
          ),
          tasa_descarte: tasaPresentable(interaccion.tasa_descarte, entregadas),
          modo_consulta: MODO_SOLO_LECTURA,
        };
      },
    });
  }
}
