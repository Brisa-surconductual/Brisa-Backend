import { HttpException, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { CronogramaPort } from '../../../cronograma/application/ports/cronograma.port';
import { EstadoCronograma } from '../../../cronograma/domain/enums/estado-cronograma.enum';
import {
  validarFechasCohorte,
  validarTransicionCohorte,
} from '../../domain/entities/cohorte/cohorte.entity';
import type {
  Cohorte,
  DatosCohorte,
} from '../../domain/entities/cohorte/cohorte.entity';
import { AccionAdministrativa } from '../../domain/enums/accion-administrativa.enum';
import { EstadoCohorte } from '../../domain/enums/estado-cohorte.enum';
import { OperacionCohorte } from '../../domain/enums/operacion-cohorte.enum';
import { RecursoAuditado } from '../../domain/enums/recurso-auditado.enum';
import { AdministrativoDomainException } from '../../domain/exceptions/domain.exception';
import { CohortesRepository } from '../../domain/repositories/cohortes.repository';
import type { AccionAuditable } from '../../domain/results/accion-auditable';
import type { ContextoAuditoria } from '../../domain/results/contexto-auditoria';
import { CohorteException } from '../exceptions/cohorte.exception';
import { AuditoriaService } from '../services/auditoria.service';

type CambiosCohorte = Partial<DatosCohorte & { estado: EstadoCohorte }>;
type ActorCohorte = ContextoAuditoria & { idUsuario: string };

function accionGestion(
  idRecurso: string,
  operacion: OperacionCohorte,
): AccionAuditable {
  return {
    accion: AccionAdministrativa.GESTION_COHORTE,
    recurso: RecursoAuditado.COHORTE,
    idRecurso,
    detalle: { operacion },
  };
}

function operacionDeCambio(estado?: EstadoCohorte): OperacionCohorte {
  if (estado === EstadoCohorte.ACTIVA) return OperacionCohorte.ACTIVAR;
  if (estado === EstadoCohorte.INACTIVA) return OperacionCohorte.INACTIVAR;
  return OperacionCohorte.EDITAR;
}

@Injectable()
export class GestionarCohortesUseCase {
  constructor(
    private readonly cohortes: CohortesRepository,
    private readonly cronogramas: CronogramaPort,
    private readonly auditoria: AuditoriaService,
  ) {}

  crear(ctx: ActorCohorte, datos: DatosCohorte): Promise<Cohorte> {
    const id = randomUUID();
    return this.ejecutar(
      ctx,
      accionGestion(id, OperacionCohorte.CREAR),
      async (tx) => {
        validarFechasCohorte(datos);
        await this.exigirCronogramaActivo(tx, datos.id_cronograma);
        return this.cohortes.crear(tx, id, datos, ctx.idUsuario);
      },
    );
  }

  actualizar(
    ctx: ActorCohorte,
    id: string,
    cambios: CambiosCohorte,
  ): Promise<Cohorte> {
    const { estado, ...campos } = cambios;
    const editaDatos = Object.values(campos).some(
      (valor) => valor !== undefined,
    );

    return this.ejecutar(
      ctx,
      accionGestion(id, operacionDeCambio(estado)),
      async (tx) => {
        if (estado === undefined && !editaDatos)
          throw new CohorteException('COHORTE_SIN_CAMBIOS');
        const actual = await this.cohortes.buscarParaActualizar(tx, id);
        if (!actual) throw new CohorteException('COHORTE_NO_ENCONTRADA');
        if (estado !== undefined)
          validarTransicionCohorte(actual.estado, estado);

        const actualizada: Cohorte = {
          ...actual,
          nombre_cohorte: campos.nombre_cohorte ?? actual.nombre_cohorte,
          fecha_inicio_programa:
            campos.fecha_inicio_programa ?? actual.fecha_inicio_programa,
          fecha_fin_programa:
            campos.fecha_fin_programa ?? actual.fecha_fin_programa,
          id_cronograma: campos.id_cronograma ?? actual.id_cronograma,
          estado: estado ?? actual.estado,
        };
        validarFechasCohorte(actualizada);
        if (editaDatos || estado === EstadoCohorte.ACTIVA) {
          await this.exigirCronogramaActivo(tx, actualizada.id_cronograma);
        }
        return this.cohortes.actualizar(tx, actualizada, ctx.idUsuario);
      },
    );
  }

  private ejecutar(
    ctx: ActorCohorte,
    accion: AccionAuditable,
    operacion: (tx: Prisma.TransactionClient) => Promise<Cohorte>,
  ): Promise<Cohorte> {
    return this.auditoria
      .ejecutar(ctx, accion, operacion)
      .catch((error: unknown) => {
        if (error instanceof HttpException) throw error;
        if (error instanceof AdministrativoDomainException)
          throw CohorteException.desdeDominio(error);
        throw new CohorteException('ERROR_PERSISTENCIA_COHORTE', error);
      });
  }

  private async exigirCronogramaActivo(
    tx: Prisma.TransactionClient,
    id: string,
  ): Promise<void> {
    const estado = await this.cronogramas.obtenerEstadoParaAsociar(tx, id);
    if (estado === null) throw new CohorteException('CRONOGRAMA_NO_ENCONTRADO');
    if (estado !== EstadoCronograma.ACTIVO)
      throw new CohorteException('CRONOGRAMA_NO_ACTIVO');
  }
}
