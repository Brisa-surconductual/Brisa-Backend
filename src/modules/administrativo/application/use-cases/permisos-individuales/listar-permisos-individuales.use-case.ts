import { Injectable } from '@nestjs/common';
import { AccionAdministrativa } from '../../../domain/enums/accion-administrativa.enum';
import { RecursoAuditado } from '../../../domain/enums/recurso-auditado.enum';
import { PermisosIndividualesRepository } from '../../../domain/repositories/permisos-individuales.repository';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import type { FiltroPermisosIndividuales } from '../../../domain/results/filtro-permisos-individuales';
import {
  aPermisoListado,
  type ListadoPermisosDtoResponse,
} from '../../dto/permisos-individuales/permiso-individual.dto-response';
import { PermisoIndividualException } from '../../exceptions/permiso-individual.exception';
import { AuditoriaService } from '../../services/auditoria.service';
import { ejecutarPermisoAuditado } from './ejecutar-auditado';

/**
 * RF-04: consulta paginada de permisos individuales. Como toda consulta del
 * módulo (RF-122), registra el acceso en la bitácora con la severidad por omisión.
 * Si se pide un `codigo_participante` que no corresponde a un estudiante responde
 * 404 `PARTICIPANTE_NO_ENCONTRADO`, igual que el POST (la consulta queda FALLIDA
 * en la bitácora); sin código sigue siendo el listado global.
 */
@Injectable()
export class ListarPermisosIndividualesUseCase {
  constructor(
    private readonly permisos: PermisosIndividualesRepository,
    private readonly auditoria: AuditoriaService,
  ) {}

  execute(
    ctx: ContextoAuditoria,
    filtro: FiltroPermisosIndividuales,
  ): Promise<ListadoPermisosDtoResponse> {
    return ejecutarPermisoAuditado(
      this.auditoria,
      ctx,
      {
        accion: AccionAdministrativa.ACCESO_MODULO,
        recurso: RecursoAuditado.PERMISOS_INDIVIDUALES,
      },
      async (tx) => {
        if (
          filtro.codigo_participante &&
          (await this.permisos.buscarIdParticipante(
            tx,
            filtro.codigo_participante,
          )) === null
        )
          throw new PermisoIndividualException('PARTICIPANTE_NO_ENCONTRADO');
        const { items, total, ahora } = await this.permisos.listar(tx, filtro);
        return {
          items: items.map((permiso) => aPermisoListado(permiso, ahora)),
          total,
          offset: filtro.offset,
          limit: filtro.limit,
        };
      },
    );
  }
}
