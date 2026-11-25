import { ServiceUnavailableException } from '@nestjs/common';
import type { DashboardPrincipal } from '../../domain/results/dashboard-principal';

/** Ninguna fuente del panel respondió; se devuelve el panel degradado (RF-140). */
export class FuentesDashboardNoDisponiblesException extends ServiceUnavailableException {
  constructor(dashboard: DashboardPrincipal) {
    super({
      statusCode: 503,
      codigo: 'FUENTES_DASHBOARD_NO_DISPONIBLES',
      ...dashboard,
    });
  }
}
