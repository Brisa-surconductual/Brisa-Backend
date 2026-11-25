import { HttpException } from '@nestjs/common';

const ERRORES_EXPORTACION_INDIVIDUAL = {
  PARTICIPANTE_NO_ENCONTRADO: [
    404,
    'El participante solicitado no existe en el sistema.',
  ],
  INCONSISTENCIA_PARTICIPANTE: [
    409,
    'No fue posible mostrar la información solicitada.',
  ],
  SIN_INDICADORES: [
    422,
    'El participante aún no tiene indicadores calculados para exportar.',
  ],
  M05_NO_DISPONIBLE: [
    503,
    'El módulo de seguimiento no se encuentra disponible en este momento.',
  ],
  EXPORTACION_ABORTADA: [
    500,
    'Ocurrió un error al procesar la exportación. La acción ha sido abortada por seguridad.',
  ],
} as const;

export type CodigoErrorExportacionIndividual =
  keyof typeof ERRORES_EXPORTACION_INDIVIDUAL;

/** Errores de la exportación CSV individual (RF-145), con cuerpo `{ status, codigo, mensaje }`. */
export class ExportacionIndividualException extends HttpException {
  constructor(
    readonly codigo: CodigoErrorExportacionIndividual,
    opciones: { cause?: unknown } = {},
  ) {
    const [status, mensaje] = ERRORES_EXPORTACION_INDIVIDUAL[codigo];
    super({ status, codigo, mensaje }, status, { cause: opciones.cause });
  }
}
