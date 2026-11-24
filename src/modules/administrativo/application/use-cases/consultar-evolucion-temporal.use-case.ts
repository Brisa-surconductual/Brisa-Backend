import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CronogramaPort } from '../../../cronograma/application/ports/cronograma.port';
import type { ContextoAuditoria } from '../../domain/auditoria';
import { construirEvolucionTemporal } from '../../domain/evolucion-temporal';
import type { EvolucionTemporal } from '../../domain/evolucion-temporal';
import { EvolucionSeguimientoPort } from '../ports/evolucion-seguimiento.port';
import { VistasAgregadasRepository } from '../ports/vistas-agregadas.repository';
import { AuditoriaService } from '../services/auditoria.service';
import { consultarFuenteConLimite } from '../services/consultar-fuente-con-limite';

function errorSerie(cause?: unknown) {
  return new InternalServerErrorException(
    {
      statusCode: 500,
      codigo: 'ERROR_CONSTRUCCION_SERIE_TEMPORAL',
      mensaje:
        'No fue posible construir la evolución temporal de indicadores en este momento. Intente nuevamente más tarde.',
    },
    { cause },
  );
}

@Injectable()
export class ConsultarEvolucionTemporalUseCase {
  constructor(
    private readonly cohortes: VistasAgregadasRepository,
    private readonly cronograma: CronogramaPort,
    private readonly seguimiento: EvolucionSeguimientoPort,
    private readonly auditoria: AuditoriaService,
  ) {}

  async ejecutar(
    ctx: ContextoAuditoria,
    idCohorte: string,
  ): Promise<EvolucionTemporal> {
    try {
      return await this.auditoria.ejecutar(
        ctx,
        {
          accion: 'CONSULTA_AGREGADA',
          recurso: 'EVOLUCION_TEMPORAL_COHORTE',
          idRecurso: idCohorte,
        },
        async (tx) => {
          const idCronograma =
            await this.cohortes.obtenerCronogramaCohorteActiva(tx, idCohorte);
          if (!idCronograma) {
            throw new NotFoundException({
              statusCode: 404,
              codigo: 'COHORTE_ACTIVA_NO_ENCONTRADA',
              mensaje:
                'No existe una cohorte activa disponible para mostrar la evolución temporal de indicadores.',
            });
          }

          const resultado = await consultarFuenteConLimite(
            () => this.seguimiento.obtener(idCohorte),
            { id_cohorte: idCohorte, estado: 'NO_DISPONIBLE' },
          );
          if (resultado?.id_cohorte !== idCohorte) throw errorSerie();
          if (resultado.estado === 'NO_DISPONIBLE') {
            throw new ServiceUnavailableException({
              statusCode: 503,
              codigo: 'SEGUIMIENTO_NO_DISPONIBLE',
              mensaje:
                'El módulo de seguimiento no está disponible en este momento. No es posible construir la evolución temporal de indicadores. Intente nuevamente más tarde.',
            });
          }
          if (resultado.estado !== 'ACTUALIZADO') throw errorSerie();

          const catalogo = await this.cronograma.listarIdsUnidadesEnOrden(
            tx,
            idCronograma,
          );
          const evolucion = construirEvolucionTemporal(
            idCohorte,
            catalogo,
            resultado.datos,
          );
          if (!evolucion) throw errorSerie();
          return evolucion;
        },
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw errorSerie(error);
    }
  }
}
