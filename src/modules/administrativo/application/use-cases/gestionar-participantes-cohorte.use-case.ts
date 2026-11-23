import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { ContextoAuditoria } from '../../domain/auditoria';
import { errorCohorte } from '../cohorte.errors';
import { errorParticipanteCohorte } from '../participante-cohorte.errors';
import { ParticipantesCohorteRepository } from '../ports/participantes-cohorte.repository';
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
        accion: 'CONSULTA_PARTICIPANTE',
        recurso: 'PARTICIPANTES_COHORTE',
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
        accion: 'CONSULTA_PARTICIPANTE',
        recurso: 'PARTICIPANTES_ELEGIBLES_COHORTE',
        idRecurso: id,
      },
      async (tx) => {
        const estado = await this.estadoCohorte(tx, id);
        return estado === 'ACTIVA'
          ? this.repository.listarElegibles(tx, id)
          : [];
      },
    );
  }

  asignar(ctx: ContextoAuditoria, id: string, codigos: string[]) {
    return this.auditoria.ejecutar(
      ctx,
      {
        accion: 'GESTION_PARTICIPANTE_COHORTE',
        recurso: 'COHORTE',
        idRecurso: id,
        detalle: { operacion: 'ASIGNAR_PARTICIPANTES' },
      },
      async (tx) => {
        const estado = await this.estadoCohorte(tx, id, true);
        if (estado !== 'ACTIVA')
          throw errorParticipanteCohorte('COHORTE_NO_ACTIVA');
        return this.repository.asignar(tx, id, codigos, ctx);
      },
    );
  }

  retirar(ctx: ContextoAuditoria, id: string, codigo: string) {
    return this.auditoria.ejecutar(
      ctx,
      {
        accion: 'GESTION_PARTICIPANTE_COHORTE',
        recurso: 'COHORTE',
        idRecurso: id,
        detalle: { operacion: 'RETIRAR_PARTICIPANTE' },
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
    if (!estado) throw errorCohorte('COHORTE_NO_ENCONTRADA');
    return estado;
  }
}
