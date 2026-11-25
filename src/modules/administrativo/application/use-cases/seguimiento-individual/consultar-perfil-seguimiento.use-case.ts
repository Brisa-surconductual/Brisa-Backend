import { Injectable } from '@nestjs/common';
import { RecursoAuditado } from '../../../domain/enums/recurso-auditado.enum';
import { SeguimientoIndividualRepository } from '../../../domain/repositories/seguimiento-individual.repository';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import {
  MODO_SOLO_LECTURA,
  type PerfilSeguimientoDtoResponse,
} from '../../dto/seguimiento-individual/seguimiento-individual.dto-response';
import {
  type PerfilSeguimientoDto,
  SeguimientoIndividualPort,
} from '../../ports/seguimiento-individual.port';
import { AuditoriaService } from '../../services/auditoria.service';
import { SeguimientoIndividualService } from '../../services/seguimiento-individual.service';
import { consultarSeguimientoAuditado } from './consultar-seguimiento-auditado';

/**
 * RF-128: perfil de seguimiento individual de un participante, en solo
 * lectura. Devuelve null (204) si M05 no tiene perfil para él.
 */
@Injectable()
export class ConsultarPerfilSeguimientoUseCase {
  constructor(
    private readonly seguimiento: SeguimientoIndividualPort,
    private readonly reglas: SeguimientoIndividualService,
    private readonly repositorio: SeguimientoIndividualRepository,
    private readonly auditoria: AuditoriaService,
  ) {}

  execute(
    ctx: ContextoAuditoria,
    codigoParticipante: string,
  ): Promise<PerfilSeguimientoDtoResponse | null> {
    return consultarSeguimientoAuditado<
      PerfilSeguimientoDto,
      PerfilSeguimientoDtoResponse
    >(this.auditoria, this.repositorio, ctx, codigoParticipante, {
      recurso: RecursoAuditado.PERFIL_SEGUIMIENTO_INDIVIDUAL,
      consulta: 'PERFIL_SEGUIMIENTO',
      obtener: () =>
        this.seguimiento.obtenerPerfilSeguimiento(codigoParticipante),
      construir: async (tx, perfil, idParticipante) => {
        this.reglas.validarPertenencia(
          perfil.codigo_participante,
          codigoParticipante,
        );
        const alertas = await this.reglas.resolverEstados(
          tx,
          idParticipante,
          perfil.alertas_activas,
        );
        return {
          codigo_participante: perfil.codigo_participante,
          indicadores_adherencia: perfil.indicadores_adherencia,
          indicadores_progreso: perfil.indicadores_progreso,
          tendencia_consumo: perfil.tendencia_consumo,
          alertas_activas: alertas.map((alerta) => ({
            id_alerta: alerta.id_alerta,
            tipo_alerta: alerta.tipo_alerta,
            fecha_generacion: alerta.fecha_generacion,
            estado_resolucion: alerta.estado_resolucion,
          })),
          fecha_actualizacion: perfil.fecha_actualizacion,
          modo_consulta: MODO_SOLO_LECTURA,
        };
      },
    });
  }
}
