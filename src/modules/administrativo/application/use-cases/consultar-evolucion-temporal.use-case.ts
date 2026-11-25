import { HttpException, Injectable } from '@nestjs/common';
import { CronogramaPort } from '../../../cronograma/application/ports/cronograma.port';
import { construirEvolucionTemporal } from '../../domain/entities/evolucion-temporal/evolucion-temporal.entity';
import { AccionAdministrativa } from '../../domain/enums/accion-administrativa.enum';
import { EstadoFuenteAgregada } from '../../domain/enums/estado-fuente-agregada.enum';
import { RecursoAuditado } from '../../domain/enums/recurso-auditado.enum';
import { VistasAgregadasRepository } from '../../domain/repositories/vistas-agregadas.repository';
import type { ContextoAuditoria } from '../../domain/results/contexto-auditoria';
import type { EvolucionTemporal } from '../../domain/results/evolucion-temporal';
import { CohorteActivaNoEncontradaException } from '../exceptions/cohorte-activa-no-encontrada.exception';
import { ConstruccionSerieTemporalException } from '../exceptions/construccion-serie-temporal.exception';
import { SeguimientoNoDisponibleException } from '../exceptions/seguimiento-no-disponible.exception';
import { EvolucionSeguimientoPort } from '../ports/evolucion-seguimiento.port';
import { AuditoriaService } from '../services/auditoria.service';
import { consultarFuenteConLimite } from '../services/consultar-fuente-con-limite';

const MENSAJE_COHORTE_NO_ENCONTRADA =
  'No existe una cohorte activa disponible para mostrar la evolución temporal de indicadores.';

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
          accion: AccionAdministrativa.CONSULTA_AGREGADA,
          recurso: RecursoAuditado.EVOLUCION_TEMPORAL_COHORTE,
          idRecurso: idCohorte,
        },
        async (tx) => {
          const idCronograma =
            await this.cohortes.obtenerCronogramaCohorteActiva(tx, idCohorte);
          if (!idCronograma)
            throw new CohorteActivaNoEncontradaException(
              MENSAJE_COHORTE_NO_ENCONTRADA,
            );

          const resultado = await consultarFuenteConLimite(
            () => this.seguimiento.obtener(idCohorte),
            {
              id_cohorte: idCohorte,
              estado: EstadoFuenteAgregada.NO_DISPONIBLE,
            },
          );
          if (resultado?.id_cohorte !== idCohorte)
            throw new ConstruccionSerieTemporalException();
          if (resultado.estado === EstadoFuenteAgregada.NO_DISPONIBLE)
            throw new SeguimientoNoDisponibleException();
          if (resultado.estado !== EstadoFuenteAgregada.ACTUALIZADO)
            throw new ConstruccionSerieTemporalException();

          const catalogo = await this.cronograma.listarIdsUnidadesEnOrden(
            tx,
            idCronograma,
          );
          const evolucion = construirEvolucionTemporal(
            idCohorte,
            catalogo,
            resultado.datos,
          );
          if (!evolucion) throw new ConstruccionSerieTemporalException();
          return evolucion;
        },
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ConstruccionSerieTemporalException(error);
    }
  }
}
