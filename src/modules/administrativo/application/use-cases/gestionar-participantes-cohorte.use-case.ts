import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { AccionAdministrativa } from '../../domain/enums/accion-administrativa.enum';
import { EstadoCohorte } from '../../domain/enums/estado-cohorte.enum';
import { OperacionParticipanteCohorte } from '../../domain/enums/operacion-participante-cohorte.enum';
import { RecursoAuditado } from '../../domain/enums/recurso-auditado.enum';
import { ParticipantesCohorteRepository } from '../../domain/repositories/participantes-cohorte.repository';
import type { ContextoAuditoria } from '../../domain/results/contexto-auditoria';
import { CohorteException } from '../exceptions/cohorte.exception';
import { ParticipanteCohorteException } from '../exceptions/participante-cohorte.exception';
import { AuditoriaService } from '../services/auditoria.service';

@Injectable()
export class GestionarParticipantesCohorteUseCase {
  constructor(
    private readonly repository: ParticipantesCohorteRepository,
    private readonly auditoria: AuditoriaService,
  ) {}

  listar(ctx: ContextoAuditoria, id: string) {
    return this.auditoria.ejecutar(
      ctx,
      {
        accion: AccionAdministrativa.CONSULTA_PARTICIPANTE,
        recurso: RecursoAuditado.PARTICIPANTES_COHORTE,
        idRecurso: id,
      },
      async (tx) => {
        await this.estadoCohorte(tx, id);
        return this.repository.listar(tx, id);
      },
    );
  }

  listarElegibles(ctx: ContextoAuditoria, id: string) {
    return this.auditoria.ejecutar(
      ctx,
      {
        accion: AccionAdministrativa.CONSULTA_PARTICIPANTE,
        recurso: RecursoAuditado.PARTICIPANTES_ELEGIBLES_COHORTE,
        idRecurso: id,
      },
      async (tx) => {
        const estado = await this.estadoCohorte(tx, id);
        return estado === EstadoCohorte.ACTIVA
          ? this.repository.listarElegibles(tx, id)
          : [];
      },
    );
  }

  asignar(ctx: ContextoAuditoria, id: string, codigos: string[]) {
    return this.auditoria.ejecutar(
      ctx,
      {
        accion: AccionAdministrativa.GESTION_PARTICIPANTE_COHORTE,
        recurso: RecursoAuditado.COHORTE,
        idRecurso: id,
        detalle: {
          operacion: OperacionParticipanteCohorte.ASIGNAR_PARTICIPANTES,
        },
      },
      async (tx) => {
        const estado = await this.estadoCohorte(tx, id, true);
        if (estado !== EstadoCohorte.ACTIVA)
          throw new ParticipanteCohorteException('COHORTE_NO_ACTIVA');
        return this.repository.asignar(tx, id, codigos, ctx);
      },
    );
  }

  retirar(ctx: ContextoAuditoria, id: string, codigo: string) {
    return this.auditoria.ejecutar(
      ctx,
      {
        accion: AccionAdministrativa.GESTION_PARTICIPANTE_COHORTE,
        recurso: RecursoAuditado.COHORTE,
        idRecurso: id,
        detalle: {
          operacion: OperacionParticipanteCohorte.RETIRAR_PARTICIPANTE,
        },
      },
      async (tx) => {
        await this.estadoCohorte(tx, id, true);
        return this.repository.retirar(tx, id, codigo, ctx);
      },
    );
  }

  private async estadoCohorte(
    tx: Prisma.TransactionClient,
    id: string,
    bloquear = false,
  ) {
    const estado = await this.repository.estadoCohorte(tx, id, bloquear);
    if (!estado) throw new CohorteException('COHORTE_NO_ENCONTRADA');
    return estado;
  }
}
