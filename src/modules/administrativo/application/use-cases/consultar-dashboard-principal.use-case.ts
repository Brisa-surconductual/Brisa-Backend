import { HttpException, Injectable } from '@nestjs/common';
import {
  dashboardSinCohorte,
  ensamblarDashboard,
} from '../../domain/entities/dashboard-principal/dashboard-principal.entity';
import { AccionAdministrativa } from '../../domain/enums/accion-administrativa.enum';
import { EstadoAccion } from '../../domain/enums/estado-accion.enum';
import { EstadoAgregacion } from '../../domain/enums/estado-agregacion.enum';
import { EstadoDashboard } from '../../domain/enums/estado-dashboard.enum';
import { EstadoVistaAgregada } from '../../domain/enums/estado-vista-agregada.enum';
import { RecursoAuditado } from '../../domain/enums/recurso-auditado.enum';
import { VistasAgregadasRepository } from '../../domain/repositories/vistas-agregadas.repository';
import type { AccionAuditable } from '../../domain/results/accion-auditable';
import type { ContextoAuditoria } from '../../domain/results/contexto-auditoria';
import type { DashboardPrincipal } from '../../domain/results/dashboard-principal';
import type {
  DatosVistaAgregada,
  VistaAgregada,
} from '../../domain/results/vista-agregada';
import { CohorteActivaAmbiguaException } from '../exceptions/cohorte-activa-ambigua.exception';
import { CohorteActivaCambioException } from '../exceptions/cohorte-activa-cambio.exception';
import { ConsultaDashboardException } from '../exceptions/consulta-dashboard.exception';
import { FuentesDashboardNoDisponiblesException } from '../exceptions/fuentes-dashboard-no-disponibles.exception';
import { RegistroAuditoriaException } from '../exceptions/registro-auditoria.exception';
import { AuditoriaService } from '../services/auditoria.service';
import { ConsultarVistaConductualUseCase } from './consultar-vista-conductual.use-case';
import { ConsultarVistaNarrativaUseCase } from './consultar-vista-narrativa.use-case';
import { ConsultarVistaNotificacionesUseCase } from './consultar-vista-notificaciones.use-case';

function esDashboardSinFuentes({ estado }: DashboardPrincipal): boolean {
  return (
    estado === EstadoDashboard.NO_DISPONIBLE ||
    estado === EstadoDashboard.DESACTUALIZADO
  );
}

function resolverVista<T extends DatosVistaAgregada>(
  resultado: PromiseSettledResult<VistaAgregada<T>>,
  idCohorte: string,
): VistaAgregada<T> {
  if (resultado.status === 'fulfilled') return resultado.value;
  if (resultado.reason instanceof RegistroAuditoriaException)
    throw resultado.reason;

  return {
    id_cohorte: idCohorte,
    estado: EstadoVistaAgregada.NO_DISPONIBLE,
    estado_agregacion: EstadoAgregacion.ERROR_ACTUALIZACION,
    ultimo_timestamp_disponible: null,
    motivo_sin_datos: null,
    mensaje: 'Esta vista no está disponible en este momento.',
    datos: null,
  };
}

@Injectable()
export class ConsultarDashboardPrincipalUseCase {
  constructor(
    private readonly vistas: VistasAgregadasRepository,
    private readonly conductual: ConsultarVistaConductualUseCase,
    private readonly narrativa: ConsultarVistaNarrativaUseCase,
    private readonly notificaciones: ConsultarVistaNotificacionesUseCase,
    private readonly auditoria: AuditoriaService,
  ) {}

  async ejecutar(ctx: ContextoAuditoria): Promise<DashboardPrincipal> {
    const accion: AccionAuditable = {
      accion: AccionAdministrativa.CONSULTA_AGREGADA,
      recurso: RecursoAuditado.DASHBOARD_PRINCIPAL_COHORTE,
    };

    let idCohorte: string | null;
    let ambigua: boolean;
    let respuesta: DashboardPrincipal;
    try {
      const ids = await this.vistas.identificarCohortesActivas();
      ambigua = ids.length > 1;
      idCohorte = ambigua ? null : (ids[0] ?? null);
      accion.idRecurso = idCohorte;
      respuesta = idCohorte
        ? await this.consultarVistas(ctx, idCohorte)
        : dashboardSinCohorte();
    } catch (error) {
      await this.auditoria.registrarIntento(ctx, accion, EstadoAccion.FALLIDA);
      if (error instanceof RegistroAuditoriaException) throw error;
      throw new ConsultaDashboardException(error);
    }

    try {
      await this.auditoria.ejecutar(
        ctx,
        accion,
        async (tx) => {
          const actuales = await this.vistas.identificarCohortesActivas(tx);
          if (ambigua || actuales.length > 1)
            throw new CohorteActivaAmbiguaException();
          if (idCohorte !== (actuales[0] ?? null))
            throw new CohorteActivaCambioException();
          return respuesta;
        },
        (dashboard) =>
          esDashboardSinFuentes(dashboard)
            ? EstadoAccion.FALLIDA
            : EstadoAccion.EXITOSA,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ConsultaDashboardException(error);
    }

    if (esDashboardSinFuentes(respuesta))
      throw new FuentesDashboardNoDisponiblesException(respuesta);
    return respuesta;
  }

  private async consultarVistas(ctx: ContextoAuditoria, idCohorte: string) {
    const opciones = { conservarVistaDegradada: true };
    const [conductual, narrativa, notificaciones] = await Promise.allSettled([
      this.conductual.ejecutar(ctx, idCohorte, opciones),
      this.narrativa.ejecutar(ctx, idCohorte, opciones),
      this.notificaciones.ejecutar(ctx, idCohorte, opciones),
    ]);

    return ensamblarDashboard(idCohorte, {
      vista_conductual: resolverVista(conductual, idCohorte),
      vista_narrativa: resolverVista(narrativa, idCohorte),
      vista_notificaciones: resolverVista(notificaciones, idCohorte),
    });
  }
}
