import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AccionAdministrativa } from '../../../domain/enums/accion-administrativa.enum';
import { OperacionPermisoIndividual } from '../../../domain/enums/operacion-permiso-individual.enum';
import { RecursoAuditado } from '../../../domain/enums/recurso-auditado.enum';
import { SeveridadAuditoria } from '../../../domain/enums/severidad-auditoria.enum';
import { AutoconcesionNoPermitidaException } from '../../../domain/exceptions/permiso-individual.exceptions';
import { PermisosIndividualesRepository } from '../../../domain/repositories/permisos-individuales.repository';
import type { AccionAuditable } from '../../../domain/results/accion-auditable';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import { VigenciaPermiso } from '../../../domain/value-objects/vigencia-permiso.vo';
import type { OtorgarPermisoIndividualDtoRequest } from '../../dto/permisos-individuales/otorgar-permiso-individual.dto-request';
import {
  aPermisoOtorgado,
  type PermisoOtorgadoDtoResponse,
} from '../../dto/permisos-individuales/permiso-individual.dto-response';
import { PermisoIndividualException } from '../../exceptions/permiso-individual.exception';
import { AuditoriaService } from '../../services/auditoria.service';
import { ejecutarPermisoAuditado } from './ejecutar-auditado';

/**
 * RF-04: un COORDINADOR_PSI otorga a un ADMINISTRATIVO un permiso explícito de
 * acceso individual sobre un participante. El permiso y su auditoría
 * (GESTION_PERMISO_INDIVIDUAL, severidad ALTA) se confirman en la misma transacción.
 */
@Injectable()
export class OtorgarPermisoIndividualUseCase {
  constructor(
    private readonly permisos: PermisosIndividualesRepository,
    private readonly auditoria: AuditoriaService,
  ) {}

  execute(
    ctx: ContextoAuditoria,
    dto: OtorgarPermisoIndividualDtoRequest,
  ): Promise<PermisoOtorgadoDtoResponse> {
    // El id se genera antes para que la bitácora lo referencie en la misma transacción.
    const idPermiso = randomUUID();
    const accion: AccionAuditable = {
      accion: AccionAdministrativa.GESTION_PERMISO_INDIVIDUAL,
      recurso: RecursoAuditado.PERMISO_INDIVIDUAL,
      idRecurso: idPermiso,
      severidad: SeveridadAuditoria.ALTA,
      detalle: {
        operacion: OperacionPermisoIndividual.OTORGAR,
        alcance: dto.alcance,
        codigo_participante: dto.codigo_participante,
        id_usuario_beneficiario: dto.id_usuario_beneficiario,
        fecha_fin_vigencia: dto.fecha_fin_vigencia ?? null,
      },
    };

    return ejecutarPermisoAuditado(this.auditoria, ctx, accion, async (tx) => {
      if (ctx.idUsuario === dto.id_usuario_beneficiario)
        throw new AutoconcesionNoPermitidaException();
      const vigencia = VigenciaPermiso.crear(
        dto.fecha_fin_vigencia ? new Date(dto.fecha_fin_vigencia) : null,
        new Date(),
      );

      const idParticipante = await this.permisos.buscarIdParticipante(
        tx,
        dto.codigo_participante,
      );
      if (!idParticipante)
        throw new PermisoIndividualException('PARTICIPANTE_NO_ENCONTRADO');
      accion.idParticipante = idParticipante;

      await this.permisos.cerrarVencidos(
        tx,
        dto.id_usuario_beneficiario,
        idParticipante,
        dto.alcance,
        ctx,
      );
      const permiso = await this.permisos.otorgar(tx, {
        id_permiso: idPermiso,
        id_usuario_beneficiario: dto.id_usuario_beneficiario,
        id_participante: idParticipante,
        alcance: dto.alcance,
        fecha_fin_vigencia: vigencia.fin,
        otorgado_por: ctx.idUsuario as string,
      });
      // Recien otorgado y con fin futuro ya validado: vigente por definicion.
      return { ...aPermisoOtorgado(permiso, new Date()), vigente: true };
    });
  }
}
