import { Injectable } from '@nestjs/common';
import { RecursoAuditado } from '../../../domain/enums/recurso-auditado.enum';
import { SeguimientoIndividualRepository } from '../../../domain/repositories/seguimiento-individual.repository';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import type { ProgresionNarrativaDtoResponse } from '../../dto/seguimiento-individual/progresion-narrativa.dto-response';
import { MODO_SOLO_LECTURA } from '../../dto/seguimiento-individual/seguimiento-individual.dto-response';
import {
  NarrativaIndividualPort,
  type ProgresionNarrativaM06,
} from '../../ports/narrativa-individual.port';
import { AuditoriaService } from '../../services/auditoria.service';
import { SeguimientoIndividualService } from '../../services/seguimiento-individual.service';
import { consultarSeguimientoAuditado } from './consultar-seguimiento-auditado';

/**
 * RF-130: progresión narrativa individual de un participante, en solo lectura,
 * según lo que expone M06 (RF-116). No modifica el perfil narrativo, no
 * desbloquea logros ni calcula niveles.
 *
 * Devuelve null (204) si el participante no tiene perfil narrativo.
 */
@Injectable()
export class ConsultarProgresionNarrativaUseCase {
  constructor(
    private readonly narrativa: NarrativaIndividualPort,
    private readonly reglas: SeguimientoIndividualService,
    private readonly repositorio: SeguimientoIndividualRepository,
    private readonly auditoria: AuditoriaService,
  ) {}

  execute(
    ctx: ContextoAuditoria,
    codigoParticipante: string,
  ): Promise<ProgresionNarrativaDtoResponse | null> {
    return consultarSeguimientoAuditado<
      ProgresionNarrativaM06,
      ProgresionNarrativaDtoResponse
    >(this.auditoria, this.repositorio, ctx, codigoParticipante, {
      fuente: 'M06',
      recurso: RecursoAuditado.PROGRESION_NARRATIVA_INDIVIDUAL,
      consulta: 'PROGRESION_NARRATIVA',
      obtener: (idParticipante) =>
        this.narrativa.obtenerProgresionNarrativa(idParticipante),
      construir: (_tx, progresion, idParticipante) => {
        // Aislamiento por participante: M06 debe responder por el mismo usuario.
        this.reglas.validarPertenencia(progresion.id_usuario, idParticipante);
        return {
          codigo_participante: codigoParticipante,
          id_fase_activa: progresion.id_fase_activa,
          nombre_fase_activa: progresion.nombre_fase_activa,
          id_capitulo_completado: progresion.id_capitulo_completado ?? null,
          logros_narrativos_desbloqueados: (
            progresion.logros_narrativos_desbloqueados ?? []
          ).map(({ id_logro, nombre_logro, fecha_desbloqueo }) => ({
            id_logro,
            nombre_logro,
            fecha_desbloqueo,
          })),
          modo_consulta: MODO_SOLO_LECTURA,
        };
      },
    });
  }
}
