import { Injectable } from '@nestjs/common';
import { proyectarDatosNotificaciones } from '../../domain/entities/vistas-agregadas/vista-notificaciones.entity';
import { EstadoVistaAgregada } from '../../domain/enums/estado-vista-agregada.enum';
import { RecursoAuditado } from '../../domain/enums/recurso-auditado.enum';
import { TipoVistaAgregada } from '../../domain/enums/tipo-vista-agregada.enum';
import type { ContextoAuditoria } from '../../domain/results/contexto-auditoria';
import { NotificacionesAgregadasPort } from '../ports/notificaciones-agregadas.port';
import { ConsultarVistaAgregadaUseCase } from './consultar-vista-agregada.use-case';
import type { OpcionesConsultaAgregada } from './consultar-vista-agregada.use-case';

@Injectable()
export class ConsultarVistaNotificacionesUseCase {
  constructor(
    private readonly consultar: ConsultarVistaAgregadaUseCase,
    private readonly notificaciones: NotificacionesAgregadasPort,
  ) {}

  ejecutar(
    ctx: ContextoAuditoria,
    idCohorte: string,
    opciones?: OpcionesConsultaAgregada,
  ) {
    return this.consultar.ejecutar(
      ctx,
      idCohorte,
      this.notificaciones,
      {
        tipo: TipoVistaAgregada.NOTIFICACIONES,
        recurso: RecursoAuditado.VISTA_AGREGADA_NOTIFICACIONES,
        mensajeNoEncontrada:
          'No existe una cohorte activa disponible para mostrar las métricas de efectividad de notificaciones.',
        mensajeError:
          'No fue posible consultar las métricas de efectividad de notificaciones de la cohorte activa en este momento. Intente nuevamente más tarde.',
        mensajePendiente:
          'La cohorte activa no cuenta todavía con métricas de efectividad de notificaciones consolidadas.',
        mensajeIndisponible:
          'El módulo de notificaciones no está disponible en este momento.',
        estadoPendiente: EstadoVistaAgregada.DISPONIBLE,
        proyectar: proyectarDatosNotificaciones,
      },
      opciones,
    );
  }
}
