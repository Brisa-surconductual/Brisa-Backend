import { Injectable } from '@nestjs/common';
import type { ContextoAuditoria } from '../../domain/auditoria';
import { proyectarDatosNarrativos } from '../../domain/vista-narrativa';
import { NarrativaAgregadaPort } from '../ports/narrativa-agregada.port';
import { ConsultarVistaAgregadaUseCase } from './consultar-vista-agregada.use-case';

@Injectable()
export class ConsultarVistaNarrativaUseCase {
  constructor(
    private readonly consultar: ConsultarVistaAgregadaUseCase,
    private readonly narrativa: NarrativaAgregadaPort,
  ) {}

  ejecutar(ctx: ContextoAuditoria, idCohorte: string) {
    return this.consultar.ejecutar(ctx, idCohorte, this.narrativa, {
      tipo: 'NARRATIVA',
      recurso: 'VISTA_AGREGADA_NARRATIVA',
      mensajeNoEncontrada:
        'No existe una cohorte activa disponible para mostrar la progresión narrativa agregada.',
      mensajeError:
        'No fue posible consultar la progresión narrativa agregada de la cohorte activa en este momento. Intente nuevamente más tarde.',
      mensajePendiente:
        'La cohorte activa no cuenta todavía con progresión narrativa consolidada. La vista se mostrará cuando existan perfiles narrativos activos en la cohorte.',
      mensajeIndisponible:
        'El módulo de gamificación no está disponible en este momento.',
      proyectar: proyectarDatosNarrativos,
    });
  }
}
