import { ServiceUnavailableException } from '@nestjs/common';

/** El módulo de seguimiento (M05) no respondió la serie temporal (RF-141). */
export class SeguimientoNoDisponibleException extends ServiceUnavailableException {
  constructor() {
    super({
      statusCode: 503,
      codigo: 'SEGUIMIENTO_NO_DISPONIBLE',
      mensaje:
        'El módulo de seguimiento no está disponible en este momento. No es posible construir la evolución temporal de indicadores. Intente nuevamente más tarde.',
    });
  }
}
