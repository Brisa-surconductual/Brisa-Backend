import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  AccionAuditable,
  ContextoAuditoria,
} from '../../domain/auditoria';
import {
  dashboardSinCohorte,
  ensamblarDashboard,
} from '../../domain/dashboard-principal';
import type { DashboardPrincipal } from '../../domain/dashboard-principal';
import type {
  DatosVistaAgregada,
  VistaAgregada,
} from '../../domain/vista-agregada';
import { VistasAgregadasRepository } from '../ports/vistas-agregadas.repository';
import {
  AuditoriaService,
  RegistroAuditoriaException,
} from '../services/auditoria.service';
import { ConsultarVistaConductualUseCase } from './consultar-vista-conductual.use-case';
import { ConsultarVistaNarrativaUseCase } from './consultar-vista-narrativa.use-case';
import { ConsultarVistaNotificacionesUseCase } from './consultar-vista-notificaciones.use-case';

function errorConsulta(cause: unknown) {
  return new InternalServerErrorException(
    {
      statusCode: 500,
      codigo: 'ERROR_CONSULTA_DASHBOARD',
      mensaje:
        'No fue posible generar el panel principal en este momento. Intente nuevamente más tarde.',
    },
    { cause },
  );
}

function conflictoCohorte(ambigua: boolean) {
  return new ConflictException({
    statusCode: 409,
    codigo: ambigua ? 'COHORTE_ACTIVA_AMBIGUA' : 'COHORTE_ACTIVA_CAMBIO',
    mensaje: ambigua
      ? 'Hay más de una cohorte activa. Revise la gestión de cohortes para determinar cuál corresponde al panel principal.'
      : 'La cohorte activa cambió durante la consulta. Intente nuevamente.',
  });
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
    estado: 'NO_DISPONIBLE',
    estado_agregacion: 'ERROR_ACTUALIZACION',
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
      accion: 'CONSULTA_AGREGADA',
      recurso: 'DASHBOARD_PRINCIPAL_COHORTE',
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
      await this.auditoria.registrarIntento(ctx, accion, 'FALLIDA');
      if (error instanceof RegistroAuditoriaException) throw error;
      throw errorConsulta(error);
    }

    try {
      await this.auditoria.ejecutar(
        ctx,
        accion,
        async (tx) => {
          const actuales = await this.vistas.identificarCohortesActivas(tx);
          if (ambigua || actuales.length > 1) throw conflictoCohorte(true);
          if (idCohorte !== (actuales[0] ?? null))
            throw conflictoCohorte(false);
          return respuesta;
        },
        ({ estado }) =>
          estado === 'NO_DISPONIBLE' || estado === 'DESACTUALIZADO'
            ? 'FALLIDA'
            : 'EXITOSA',
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw errorConsulta(error);
    }

    if (
      respuesta.estado === 'NO_DISPONIBLE' ||
      respuesta.estado === 'DESACTUALIZADO'
    ) {
      throw new ServiceUnavailableException({
        statusCode: 503,
        codigo: 'FUENTES_DASHBOARD_NO_DISPONIBLES',
        ...respuesta,
      });
    }
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
