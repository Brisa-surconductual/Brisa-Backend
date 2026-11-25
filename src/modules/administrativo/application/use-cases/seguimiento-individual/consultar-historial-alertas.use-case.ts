import { Injectable } from '@nestjs/common';
import { RecursoAuditado } from '../../../domain/enums/recurso-auditado.enum';
import { SeguimientoIndividualRepository } from '../../../domain/repositories/seguimiento-individual.repository';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import {
  type HistorialAlertasDtoResponse,
  MODO_SOLO_LECTURA,
} from '../../dto/seguimiento-individual/seguimiento-individual.dto-response';
import {
  type ListaAlertasDto,
  SeguimientoIndividualPort,
} from '../../ports/seguimiento-individual.port';
import { AuditoriaService } from '../../services/auditoria.service';
import { SeguimientoIndividualService } from '../../services/seguimiento-individual.service';
import { consultarSeguimientoAuditado } from './consultar-seguimiento-auditado';

export interface PaginaAlertas {
  offset: number;
  limit: number;
}

/**
 * RF-129: historial cronológico de alertas (RF-63, RF-68) de un participante,
 * en solo lectura. Devuelve null (204) si M05 no tiene alertas para él.
 */
@Injectable()
export class ConsultarHistorialAlertasUseCase {
  constructor(
    private readonly seguimiento: SeguimientoIndividualPort,
    private readonly reglas: SeguimientoIndividualService,
    private readonly repositorio: SeguimientoIndividualRepository,
    private readonly auditoria: AuditoriaService,
  ) {}

  execute(
    ctx: ContextoAuditoria,
    codigoParticipante: string,
    pagina: PaginaAlertas,
  ): Promise<HistorialAlertasDtoResponse | null> {
    return consultarSeguimientoAuditado<
      ListaAlertasDto,
      HistorialAlertasDtoResponse
    >(this.auditoria, this.repositorio, ctx, codigoParticipante, {
      recurso: RecursoAuditado.HISTORIAL_ALERTAS_PARTICIPANTE,
      consulta: 'HISTORIAL_ALERTAS',
      obtener: () =>
        this.seguimiento.obtenerAlertasParticipante(
          codigoParticipante,
          pagina.offset,
          pagina.limit,
        ),
      construir: async (tx, lista, idParticipante) => {
        this.reglas.validarPertenencia(
          lista.codigo_participante,
          codigoParticipante,
        );
        if (lista.items.length === 0) return null;
        const alertas = await this.reglas.resolverEstados(
          tx,
          idParticipante,
          lista.items,
        );
        return {
          items: alertas
            .map((alerta) => ({
              id_alerta: alerta.id_alerta,
              tipo_alerta: alerta.tipo_alerta,
              fuente_alerta: alerta.fuente_alerta,
              fecha_generacion: alerta.fecha_generacion,
              estado_resolucion: alerta.estado_resolucion,
              fecha_resolucion: alerta.fecha_resolucion,
            }))
            // RF-129: orden cronológico, la más reciente primero.
            .sort(
              (a, b) =>
                Date.parse(b.fecha_generacion) - Date.parse(a.fecha_generacion),
            ),
          total: lista.total,
          offset: pagina.offset,
          limit: pagina.limit,
          modo_consulta: MODO_SOLO_LECTURA,
        };
      },
    });
  }
}
