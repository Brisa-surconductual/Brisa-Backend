import { Injectable } from '@nestjs/common';
import type { ContextoAuditoria } from '../../domain/auditoria';
import { proyectarDatosConductuales } from '../../domain/vista-conductual';
import { SeguimientoAgregadoPort } from '../ports/seguimiento-agregado.port';
import { ConsultarVistaAgregadaUseCase } from './consultar-vista-agregada.use-case';
import type { OpcionesConsultaAgregada } from './consultar-vista-agregada.use-case';

@Injectable()
export class ConsultarVistaConductualUseCase {
  constructor(
    private readonly consultar: ConsultarVistaAgregadaUseCase,
    private readonly seguimiento: SeguimientoAgregadoPort,
  ) {}

  ejecutar(
    ctx: ContextoAuditoria,
    idCohorte: string,
    opciones?: OpcionesConsultaAgregada,
  ) {
    return this.consultar.ejecutar(
      ctx,
      idCohorte,
      this.seguimiento,
      {
        tipo: 'CONDUCTUAL',
        recurso: 'VISTA_AGREGADA_CONDUCTUAL',
        mensajeNoEncontrada:
          'No existe una cohorte activa disponible para mostrar la vista agregada.',
        mensajeError:
          'No fue posible consultar la vista agregada de la cohorte activa en este momento. Intente nuevamente más tarde.',
        mensajePendiente:
          'La cohorte activa no cuenta todavía con indicadores consolidados. La vista se mostrará cuando M05 complete su primer ciclo de consolidación.',
        mensajeIndisponible:
          'El módulo de seguimiento no está disponible en este momento.',
        proyectar: proyectarDatosConductuales,
      },
      opciones,
    );
  }
}
