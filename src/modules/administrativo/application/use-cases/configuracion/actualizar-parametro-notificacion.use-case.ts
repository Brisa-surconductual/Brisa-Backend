import { Injectable } from '@nestjs/common';
import { AccionAdministrativa } from '../../../domain/enums/accion-administrativa.enum';
import { RecursoAuditado } from '../../../domain/enums/recurso-auditado.enum';
import {
  esTipoParametroNotificacion,
  UNIDAD_PARAMETRO_NOTIFICACION,
} from '../../../domain/enums/tipo-parametro-notificacion.enum';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import type { CambioParametroNotificacionDtoResponse } from '../../dto/configuracion/configuracion.dto-response';
import { ConfiguracionException } from '../../exceptions/configuracion.exception';
import {
  type ParametrosNotificacion,
  ParametrosNotificacionPort,
} from '../../ports/parametros-notificacion.port';
import { AuditoriaService } from '../../services/auditoria.service';
import { consultarFuenteConLimite } from '../../services/consultar-fuente-con-limite';
import {
  aplicarCambioConfiguracion,
  type SolicitudCambioConfiguracion,
} from './aplicar-cambio-configuracion';

const M07_NO_DISPONIBLE = Symbol('m07-no-disponible');

/**
 * RF-137: cambia un parámetro global de M07 a través del mecanismo que le
 * corresponde (RF-87 límite diario, RF-88 intervalo mínimo, RF-89 franjas).
 * M-8 no valida ni guarda nada propio; solo compara, delega y audita.
 */
@Injectable()
export class ActualizarParametroNotificacionUseCase {
  constructor(
    private readonly parametros: ParametrosNotificacionPort,
    private readonly auditoria: AuditoriaService,
  ) {}

  async execute(
    ctx: ContextoAuditoria,
    tipoParametro: string,
    solicitud: SolicitudCambioConfiguracion,
  ): Promise<CambioParametroNotificacionDtoResponse> {
    if (!esTipoParametroNotificacion(tipoParametro))
      throw ConfiguracionException.de('TIPO_PARAMETRO_INEXISTENTE');
    const tipo = tipoParametro;

    const vigentes = await consultarFuenteConLimite<
      ParametrosNotificacion | typeof M07_NO_DISPONIBLE
    >(() => this.parametros.obtenerParametros(), M07_NO_DISPONIBLE);
    if (vigentes === M07_NO_DISPONIBLE)
      throw ConfiguracionException.de('M07_NO_DISPONIBLE');

    const unidad = UNIDAD_PARAMETRO_NOTIFICACION[tipo];
    const resultado = await aplicarCambioConfiguracion(this.auditoria, ctx, {
      vigente: vigentes[tipo],
      unidadMedida: unidad,
      solicitud,
      aplicar: (valorNuevo, valorAnteriorEsperado, actor) =>
        this.parametros.actualizarParametro(
          tipo,
          valorNuevo,
          valorAnteriorEsperado,
          actor,
        ),
      errorGuardado: 'ERROR_GUARDAR_PARAMETRO',
      auditoria: {
        accion: AccionAdministrativa.CONFIGURACION_NOTIFICACIONES,
        recurso: RecursoAuditado.PARAMETRO_NOTIFICACION,
        detalle: (cambio) => ({ tipo_parametro: tipo, ...cambio }),
      },
    });

    return {
      tipo_parametro: tipo,
      valor_anterior: resultado.valor_anterior,
      valor_vigente: resultado.valor_vigente,
      cambio_aplicado: resultado.cambio_aplicado,
    };
  }
}
