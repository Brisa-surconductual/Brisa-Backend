import { Injectable } from '@nestjs/common';
import { AccionAdministrativa } from '../../../domain/enums/accion-administrativa.enum';
import { OperacionPermisoIndividual } from '../../../domain/enums/operacion-permiso-individual.enum';
import { RecursoAuditado } from '../../../domain/enums/recurso-auditado.enum';
import { SeveridadAuditoria } from '../../../domain/enums/severidad-auditoria.enum';
import { PermisosIndividualesRepository } from '../../../domain/repositories/permisos-individuales.repository';
import type { AccionAuditable } from '../../../domain/results/accion-auditable';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import type { PermisoRevocadoDtoResponse } from '../../dto/permisos-individuales/permiso-individual.dto-response';
import { PermisoIndividualException } from '../../exceptions/permiso-individual.exception';
import { AuditoriaService } from '../../services/auditoria.service';
import { ejecutarPermisoAuditado } from './ejecutar-auditado';

/** RF-04: revocación de un permiso individual, auditada con severidad ALTA. */
@Injectable()
export class RevocarPermisoIndividualUseCase {
  constructor(
    private readonly permisos: PermisosIndividualesRepository,
    private readonly auditoria: AuditoriaService,
  ) {}

  execute(
    ctx: ContextoAuditoria,
    idPermiso: string,
  ): Promise<PermisoRevocadoDtoResponse> {
    const accion: AccionAuditable = {
      accion: AccionAdministrativa.GESTION_PERMISO_INDIVIDUAL,
      recurso: RecursoAuditado.PERMISO_INDIVIDUAL,
      idRecurso: idPermiso,
      severidad: SeveridadAuditoria.ALTA,
      detalle: { operacion: OperacionPermisoIndividual.REVOCAR },
    };

    return ejecutarPermisoAuditado(this.auditoria, ctx, accion, async (tx) => {
      const encontrado = await this.permisos.buscarPorId(tx, idPermiso, true);
      if (!encontrado)
        throw new PermisoIndividualException('PERMISO_NO_ENCONTRADO');
      accion.idParticipante = encontrado.id_participante;
      encontrado.permiso.asegurarRevocable();

      const revocado = await this.permisos.revocar(tx, idPermiso);
      return {
        id_permiso: revocado.id_permiso,
        vigente: false,
        revocado_en: (revocado.revocado_en as Date).toISOString(),
      };
    });
  }
}
