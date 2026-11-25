import { Injectable } from '@nestjs/common';
import { AccionAdministrativa } from '../../domain/enums/accion-administrativa.enum';
import { RecursoAuditado } from '../../domain/enums/recurso-auditado.enum';
import { CohortesRepository } from '../../domain/repositories/cohortes.repository';
import type { ContextoAuditoria } from '../../domain/results/contexto-auditoria';
import { CohorteException } from '../exceptions/cohorte.exception';
import { AuditoriaService } from '../services/auditoria.service';

@Injectable()
export class ConsultarCohortesUseCase {
  constructor(
    private readonly cohortes: CohortesRepository,
    private readonly auditoria: AuditoriaService,
  ) {}

  listar(ctx: ContextoAuditoria) {
    return this.auditoria.ejecutar(
      ctx,
      {
        accion: AccionAdministrativa.ACCESO_MODULO,
        recurso: RecursoAuditado.COHORTES,
      },
      (tx) => this.cohortes.consultarVigentes(tx),
    );
  }

  obtener(ctx: ContextoAuditoria, id: string) {
    return this.auditoria.ejecutar(
      ctx,
      {
        accion: AccionAdministrativa.ACCESO_MODULO,
        recurso: RecursoAuditado.COHORTE,
        idRecurso: id,
      },
      async (tx) => {
        const [cohorte] = await this.cohortes.consultarVigentes(tx, id);
        if (!cohorte) throw new CohorteException('COHORTE_NO_ENCONTRADA');
        return cohorte;
      },
    );
  }
}
