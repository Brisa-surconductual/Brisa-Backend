import { Logger } from '@nestjs/common';
import { EstadoAccion } from '../../../domain/enums/estado-accion.enum';
import { SeveridadAuditoria } from '../../../domain/enums/severidad-auditoria.enum';
import { sonValoresEquivalentes } from '../../../domain/policies/configuracion-global.policy';
import type {
  AccionAuditable,
  DetalleAuditoria,
} from '../../../domain/results/accion-auditable';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import type { ValorConfiguracion } from '../../../domain/results/valor-configuracion';
import {
  type CodigoErrorConfiguracion,
  ConfiguracionException,
} from '../../exceptions/configuracion.exception';
import {
  type ActorConfiguracion,
  type CambioConfiguracionAplicado,
  RechazoConfiguracionError,
} from '../../ports/rechazo-configuracion';
import type { AuditoriaService } from '../../services/auditoria.service';

const logger = new Logger('ConfiguracionGlobal');

export interface SolicitudCambioConfiguracion {
  valor_nuevo: unknown;
  valor_anterior_esperado: unknown;
  justificacion_cambio?: string;
}

export interface CambioConfiguracion {
  /** Valor vigente leído del módulo dueño antes del cambio. */
  vigente: ValorConfiguracion;
  unidadMedida: string;
  solicitud: SolicitudCambioConfiguracion;
  /** Delegación al puerto del módulo dueño (valida y persiste). */
  aplicar: (
    valorNuevo: unknown,
    valorAnteriorEsperado: unknown,
    actor: ActorConfiguracion,
  ) => Promise<CambioConfiguracionAplicado<ValorConfiguracion>>;
  errorGuardado: CodigoErrorConfiguracion;
  /** Acción y recurso de la bitácora; el detalle se arma con los valores. */
  auditoria: Pick<AccionAuditable, 'accion' | 'recurso'> & {
    detalle: (cambio: {
      valor_anterior: ValorConfiguracion;
      valor_nuevo: ValorConfiguracion;
      unidad_medida: string;
      justificacion_cambio: string | null;
    }) => DetalleAuditoria;
  };
}

export interface ResultadoCambioConfiguracion {
  valor_anterior: ValorConfiguracion;
  valor_vigente: ValorConfiguracion;
  cambio_aplicado: boolean;
}

/**
 * Algoritmo común de RF-136 y RF-137 (PUT idempotente con control optimista):
 * 1. si el valor propuesto es el vigente, no hace nada ni audita (200);
 * 2. si el cliente no vio el valor vigente, 409 CONFIGURACION_MODIFICADA;
 * 3. delega validación y persistencia en el módulo dueño y reenvía sus
 *    rechazos tal cual; cualquier otro fallo es un 500 sin auditoría;
 * 4. audita el cambio efectivo en modo diferido. Si la auditoría falla, el
 *    cambio se conserva: se registra por la vía de respaldo o queda en el log.
 */
export async function aplicarCambioConfiguracion(
  auditoria: AuditoriaService,
  ctx: ContextoAuditoria,
  cambio: CambioConfiguracion,
): Promise<ResultadoCambioConfiguracion> {
  const { vigente, solicitud } = cambio;

  if (sonValoresEquivalentes(solicitud.valor_nuevo, vigente))
    return {
      valor_anterior: vigente,
      valor_vigente: vigente,
      cambio_aplicado: false,
    };

  if (!sonValoresEquivalentes(solicitud.valor_anterior_esperado, vigente))
    throw ConfiguracionException.de('CONFIGURACION_MODIFICADA');

  let aplicado: CambioConfiguracionAplicado<ValorConfiguracion>;
  try {
    aplicado = await cambio.aplicar(
      solicitud.valor_nuevo,
      solicitud.valor_anterior_esperado,
      { id_usuario_administrativo: ctx.idUsuario ?? '' },
    );
  } catch (error) {
    if (error instanceof RechazoConfiguracionError)
      throw ConfiguracionException.desdeRechazo(error);
    throw ConfiguracionException.de(cambio.errorGuardado, { cause: error });
  }

  const resultado = await auditoria.registrarDiferido(ctx, {
    accion: cambio.auditoria.accion,
    recurso: cambio.auditoria.recurso,
    severidad: SeveridadAuditoria.ALTA,
    estado: EstadoAccion.EXITOSA,
    detalle: cambio.auditoria.detalle({
      valor_anterior: aplicado.valor_anterior,
      valor_nuevo: aplicado.valor_vigente,
      unidad_medida: cambio.unidadMedida,
      justificacion_cambio: solicitud.justificacion_cambio || null,
    }),
  });
  if (resultado === 'PENDIENTE')
    logger.warn(
      'La configuración fue actualizada correctamente, pero no fue posible registrar el cambio en la bitácora de auditoría.',
    );

  return {
    valor_anterior: aplicado.valor_anterior,
    valor_vigente: aplicado.valor_vigente,
    cambio_aplicado: true,
  };
}
