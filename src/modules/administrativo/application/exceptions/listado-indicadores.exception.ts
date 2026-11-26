import { HttpException } from '@nestjs/common';

const ERRORES_LISTADO_INDICADORES = {
  PARAMETRO_INVALIDO: [400, 'Los parámetros de la consulta no son válidos.'],
  COHORTE_NO_ENCONTRADA: [
    404,
    'La cohorte solicitada no existe en el sistema.',
  ],
  M05_NO_DISPONIBLE: [
    503,
    'El módulo de seguimiento no se encuentra disponible en este momento.',
  ],
  ERROR_LISTADO_INDICADORES: [
    500,
    'No fue posible cargar el listado de participantes en este momento. Intente nuevamente más tarde.',
  ],
} as const;

export type CodigoErrorListadoIndicadores =
  keyof typeof ERRORES_LISTADO_INDICADORES;

/** Errores del listado de indicadores de participantes (RF-142), con cuerpo `{ status, codigo, mensaje }`. */
export class ListadoIndicadoresException extends HttpException {
  constructor(
    readonly codigo: CodigoErrorListadoIndicadores,
    opciones: { mensaje?: string; cause?: unknown } = {},
  ) {
    const [status, mensaje] = ERRORES_LISTADO_INDICADORES[codigo];
    super({ status, codigo, mensaje: opciones.mensaje ?? mensaje }, status, {
      cause: opciones.cause,
    });
  }
}
