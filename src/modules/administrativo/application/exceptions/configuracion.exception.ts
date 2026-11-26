import { HttpException } from '@nestjs/common';
import type { RechazoConfiguracionError } from '../ports/rechazo-configuracion';

/** Mensaje de RF-137 para un intento de configuración por usuario. */
export const MENSAJE_SOLO_GLOBAL_NOTIFICACIONES =
  'Los parámetros del módulo de notificaciones son de configuración global y no admiten valores diferenciados por usuario.';

export const MENSAJE_SOLO_GLOBAL_UMBRALES =
  'Los umbrales del módulo de seguimiento son de configuración global y no admiten valores diferenciados por usuario.';

const ERRORES_CONFIGURACION = {
  CONFIGURACION_SOLO_GLOBAL: [400, MENSAJE_SOLO_GLOBAL_NOTIFICACIONES],
  CONFIGURACION_MODIFICADA: [
    409,
    'El valor cambió desde que lo consultó. Recargue y vuelva a intentarlo.',
  ],
  TIPO_UMBRAL_INEXISTENTE: [404, 'El tipo de umbral seleccionado no existe.'],
  TIPO_PARAMETRO_INEXISTENTE: [
    404,
    'El parámetro de notificación seleccionado no existe.',
  ],
  M05_NO_DISPONIBLE: [
    503,
    'El módulo de seguimiento no se encuentra disponible en este momento.',
  ],
  M07_NO_DISPONIBLE: [
    503,
    'El módulo de notificaciones no se encuentra disponible en este momento.',
  ],
  ERROR_GUARDAR_UMBRAL: [
    500,
    'No fue posible guardar la configuración del umbral en este momento. Intente nuevamente más tarde.',
  ],
  ERROR_GUARDAR_PARAMETRO: [
    500,
    'No fue posible guardar la configuración del parámetro en este momento. La configuración anterior se mantiene vigente. Intente nuevamente más tarde.',
  ],
} as const;

export type CodigoErrorConfiguracion = keyof typeof ERRORES_CONFIGURACION;

/**
 * Errores de la configuración global de M05 y M07 (RF-136, RF-137), con cuerpo
 * `{ status, codigo, mensaje }`.
 */
export class ConfiguracionException extends HttpException {
  constructor(
    readonly codigo: string,
    status: number,
    mensaje: string,
    opciones: { cause?: unknown } = {},
  ) {
    super({ status, codigo, mensaje }, status, { cause: opciones.cause });
  }

  static de(
    codigo: CodigoErrorConfiguracion,
    opciones: { mensaje?: string; cause?: unknown } = {},
  ): ConfiguracionException {
    const [status, mensaje] = ERRORES_CONFIGURACION[codigo];
    return new ConfiguracionException(
      codigo,
      status,
      opciones.mensaje ?? mensaje,
      opciones,
    );
  }

  /** Reenvía tal cual el rechazo de validación de M05 o M07. */
  static desdeRechazo(rechazo: RechazoConfiguracionError) {
    return new ConfiguracionException(
      rechazo.codigo,
      rechazo.status,
      rechazo.mensaje,
      { cause: rechazo },
    );
  }
}
