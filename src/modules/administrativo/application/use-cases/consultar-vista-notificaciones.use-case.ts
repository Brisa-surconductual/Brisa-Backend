import { Injectable } from '@nestjs/common';
import type { ContextoAuditoria } from '../../domain/auditoria';
import { proyectarDatosNotificaciones } from '../../domain/vista-notificaciones';
import { NotificacionesAgregadasPort } from '../ports/notificaciones-agregadas.port';
import { ConsultarVistaAgregadaUseCase } from './consultar-vista-agregada.use-case';

@Injectable()
export class ConsultarVistaNotificacionesUseCase {
  constructor(
    private readonly consultar: ConsultarVistaAgregadaUseCase,
    private readonly notificaciones: NotificacionesAgregadasPort,
  ) {}

  ejecutar(ctx: ContextoAuditoria, idCohorte: string) {
    return this.consultar.ejecutar(ctx, idCohorte, this.notificaciones, {
      tipo: 'NOTIFICACIONES',
      recurso: 'VISTA_AGREGADA_NOTIFICACIONES',
      mensajeNoEncontrada:
        'No existe una cohorte activa disponible para mostrar las métricas de efectividad de notificaciones.',
      mensajeError:
        'No fue posible consultar las métricas de efectividad de notificaciones de la cohorte activa en este momento. Intente nuevamente más tarde.',
      mensajePendiente:
        'La cohorte activa no cuenta todavía con métricas de efectividad de notificaciones consolidadas.',
      mensajeIndisponible:
        'El módulo de notificaciones no está disponible en este momento.',
      estadoPendiente: 'DISPONIBLE',
      proyectar: proyectarDatosNotificaciones,
    });
  }
}
