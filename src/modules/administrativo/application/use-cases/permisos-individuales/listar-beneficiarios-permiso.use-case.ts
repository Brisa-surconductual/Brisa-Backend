import { Injectable } from '@nestjs/common';
import { AccionAdministrativa } from '../../../domain/enums/accion-administrativa.enum';
import { RecursoAuditado } from '../../../domain/enums/recurso-auditado.enum';
import { PermisosIndividualesRepository } from '../../../domain/repositories/permisos-individuales.repository';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import type { ListadoBeneficiariosDtoResponse } from '../../dto/permisos-individuales/permiso-individual.dto-response';
import { AuditoriaService } from '../../services/auditoria.service';
import { ejecutarPermisoAuditado } from './ejecutar-auditado';

/**
 * BE-336: administrativos activos que pueden recibir un permiso individual.
 * Solo `id_usuario` y `correo_electronico` (la etiqueta del beneficiario); como
 * toda consulta del módulo (RF-122) queda registrada en la bitácora.
 */
@Injectable()
export class ListarBeneficiariosPermisoUseCase {
  constructor(
    private readonly permisos: PermisosIndividualesRepository,
    private readonly auditoria: AuditoriaService,
  ) {}

  execute(
    ctx: ContextoAuditoria,
    pagina: { offset: number; limit: number },
  ): Promise<ListadoBeneficiariosDtoResponse> {
    return ejecutarPermisoAuditado(
      this.auditoria,
      ctx,
      {
        accion: AccionAdministrativa.ACCESO_MODULO,
        recurso: RecursoAuditado.PERMISOS_INDIVIDUALES,
      },
      async (tx) => {
        const { items, total } = await this.permisos.listarBeneficiarios(
          tx,
          pagina,
        );
        return {
          items: items.map(({ id_usuario, correo_electronico }) => ({
            id_usuario,
            correo_electronico,
          })),
          total,
          offset: pagina.offset,
          limit: pagina.limit,
        };
      },
    );
  }
}
