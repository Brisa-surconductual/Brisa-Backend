import { Injectable } from '@nestjs/common';
import { AccionAdministrativa } from '../../../domain/enums/accion-administrativa.enum';
import { RecursoAuditado } from '../../../domain/enums/recurso-auditado.enum';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import type { CambioUmbralDtoResponse } from '../../dto/configuracion/configuracion.dto-response';
import { ConfiguracionException } from '../../exceptions/configuracion.exception';
import {
  type UmbralVigente,
  UmbralesSeguimientoPort,
} from '../../ports/umbrales-seguimiento.port';
import { AuditoriaService } from '../../services/auditoria.service';
import { consultarFuenteConLimite } from '../../services/consultar-fuente-con-limite';
import {
  aplicarCambioConfiguracion,
  type SolicitudCambioConfiguracion,
} from './aplicar-cambio-configuracion';

const M05_NO_DISPONIBLE = Symbol('m05-no-disponible');

/**
 * RF-136: cambia un umbral de M05 a través de RF-79. M-8 no valida el rango ni
 * guarda nada propio; solo compara con el vigente, delega y audita el cambio.
 */
@Injectable()
export class ActualizarUmbralUseCase {
  constructor(
    private readonly umbrales: UmbralesSeguimientoPort,
    private readonly auditoria: AuditoriaService,
  ) {}

  async execute(
    ctx: ContextoAuditoria,
    tipoUmbral: string,
    solicitud: SolicitudCambioConfiguracion,
  ): Promise<CambioUmbralDtoResponse> {
    const vigente = await consultarFuenteConLimite<
      UmbralVigente | null | typeof M05_NO_DISPONIBLE
    >(() => this.umbrales.obtenerUmbral(tipoUmbral), M05_NO_DISPONIBLE);
    if (vigente === M05_NO_DISPONIBLE)
      throw ConfiguracionException.de('M05_NO_DISPONIBLE');
    if (!vigente) throw ConfiguracionException.de('TIPO_UMBRAL_INEXISTENTE');

    const resultado = await aplicarCambioConfiguracion(this.auditoria, ctx, {
      vigente: vigente.valor,
      unidadMedida: vigente.unidad_medida,
      solicitud,
      aplicar: (valorNuevo, valorAnteriorEsperado, actor) =>
        this.umbrales.actualizarUmbral(
          tipoUmbral,
          valorNuevo,
          valorAnteriorEsperado,
          actor,
        ),
      errorGuardado: 'ERROR_GUARDAR_UMBRAL',
      auditoria: {
        accion: AccionAdministrativa.CONFIGURACION_UMBRALES,
        recurso: RecursoAuditado.UMBRAL_SEGUIMIENTO,
        detalle: (cambio) => ({ tipo_umbral: tipoUmbral, ...cambio }),
      },
    });

    return {
      tipo_umbral: tipoUmbral,
      valor_anterior: resultado.valor_anterior,
      valor_vigente: resultado.valor_vigente,
      unidad_medida: vigente.unidad_medida,
      cambio_aplicado: resultado.cambio_aplicado,
    };
  }
}
