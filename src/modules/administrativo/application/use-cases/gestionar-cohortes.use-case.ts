import { HttpException, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { CronogramaPort } from '../../../cronograma/application/ports/cronograma.port';
import { EstadoCronograma } from '../../../cronograma/domain/enums/estado-cronograma.enum';
import type {
  AccionAuditable,
  ContextoAuditoria,
} from '../../domain/auditoria';
import type {
  Cohorte,
  DatosCohorte,
  EstadoCohorte,
  OperacionCohorte,
} from '../../domain/cohorte';
import { errorCohorte } from '../cohorte.errors';
import { CohortesRepository } from '../ports/cohortes.repository';
import { AuditoriaService } from '../services/auditoria.service';

type CambiosCohorte = Partial<DatosCohorte & { estado: EstadoCohorte }>;
type ActorCohorte = ContextoAuditoria & { idUsuario: string };

const SIGUIENTE_ESTADO: Record<EstadoCohorte, EstadoCohorte> = {
  BORRADOR: 'ACTIVA',
  ACTIVA: 'INACTIVA',
  INACTIVA: 'ACTIVA',
};

function accionGestion(
  idRecurso: string,
  operacion: OperacionCohorte,
): AccionAuditable {
  return {
    accion: 'GESTION_COHORTE',
    recurso: 'COHORTE',
    idRecurso,
    detalle: { operacion },
  };
}

function validarFechas(datos: DatosCohorte): void {
  if (datos.fecha_fin_programa < datos.fecha_inicio_programa) {
    throw errorCohorte('FECHAS_COHORTE_INVALIDAS');
  }
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
    return this.ejecutar(ctx, accionGestion(id, 'CREAR'), async (tx) => {
      validarFechas(datos);
      await this.exigirCronogramaActivo(tx, datos.id_cronograma);
      return this.cohortes.crear(tx, id, datos, ctx.idUsuario);
    });
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
    const operacion =
      estado === 'ACTIVA'
        ? 'ACTIVAR'
        : estado === 'INACTIVA'
          ? 'INACTIVAR'
          : 'EDITAR';

    return this.ejecutar(ctx, accionGestion(id, operacion), async (tx) => {
      if (estado === undefined && !editaDatos)
        throw errorCohorte('COHORTE_SIN_CAMBIOS');
      const actual = await this.cohortes.buscarParaActualizar(tx, id);
      if (!actual) throw errorCohorte('COHORTE_NO_ENCONTRADA');
      if (estado !== undefined && SIGUIENTE_ESTADO[actual.estado] !== estado) {
        throw errorCohorte('TRANSICION_COHORTE_INVALIDA');
      }

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
      validarFechas(actualizada);
      if (editaDatos || estado === 'ACTIVA') {
        await this.exigirCronogramaActivo(tx, actualizada.id_cronograma);
      }
      return this.cohortes.actualizar(tx, actualizada, ctx.idUsuario);
    });
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
        throw errorCohorte('ERROR_PERSISTENCIA_COHORTE', error);
      });
  }

  private async exigirCronogramaActivo(
    tx: Prisma.TransactionClient,
    id: string,
  ): Promise<void> {
    const estado = await this.cronogramas.obtenerEstadoParaAsociar(tx, id);
    if (estado === null) throw errorCohorte('CRONOGRAMA_NO_ENCONTRADO');
    if (estado !== EstadoCronograma.ACTIVO)
      throw errorCohorte('CRONOGRAMA_NO_ACTIVO');
  }
}
