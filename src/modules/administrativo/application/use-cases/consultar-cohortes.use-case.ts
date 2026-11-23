import { Injectable } from '@nestjs/common';
import type { ContextoAuditoria } from '../../domain/auditoria';
import { errorCohorte } from '../cohorte.errors';
import { CohortesRepository } from '../ports/cohortes.repository';
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
      { accion: 'ACCESO_MODULO', recurso: 'COHORTES' },
      (tx) => this.cohortes.consultarVigentes(tx),
    );
  }

  obtener(ctx: ContextoAuditoria, id: string) {
    return this.auditoria.ejecutar(
      ctx,
      { accion: 'ACCESO_MODULO', recurso: 'COHORTE', idRecurso: id },
      async (tx) => {
        const [cohorte] = await this.cohortes.consultarVigentes(tx, id);
        if (!cohorte) throw errorCohorte('COHORTE_NO_ENCONTRADA');
        return cohorte;
      },
    );
  }
}
