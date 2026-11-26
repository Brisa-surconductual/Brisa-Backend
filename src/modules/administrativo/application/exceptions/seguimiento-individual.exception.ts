import { HttpException } from '@nestjs/common';

const ERRORES_SEGUIMIENTO_INDIVIDUAL = {
  PARTICIPANTE_NO_ENCONTRADO: [404, 'El participante seleccionado no existe.'],
  INCONSISTENCIA_PARTICIPANTE: [
    409,
    'No fue posible mostrar la información solicitada.',
  ],
  M05_NO_DISPONIBLE: [
    503,
    'El módulo de seguimiento no se encuentra disponible en este momento.',
  ],
  M06_NO_DISPONIBLE: [
    503,
    'El módulo de gamificación no se encuentra disponible en este momento.',
  ],
  M07_NO_DISPONIBLE: [
    503,
    'El módulo de notificaciones no se encuentra disponible en este momento.',
  ],
  ERROR_CONSULTA_SEGUIMIENTO: [
    500,
    'No fue posible consultar el seguimiento individual del participante.',
  ],
  ERROR_CONSULTA_NARRATIVA: [
    500,
    'No fue posible cargar la progresión narrativa individual del participante.',
  ],
  ERROR_CONSULTA_NOTIFICACIONES: [
    500,
    'No fue posible cargar el historial de interacción con notificaciones del participante.',
  ],
} as const;

export type CodigoErrorSeguimientoIndividual =
  keyof typeof ERRORES_SEGUIMIENTO_INDIVIDUAL;

/**
 * Errores de las consultas individuales de un participante: perfil y alertas
 * (RF-128, RF-129), progresión narrativa (RF-130) e interacción con
 * notificaciones (RF-131).
 */
export class SeguimientoIndividualException extends HttpException {
  constructor(
    readonly codigo: CodigoErrorSeguimientoIndividual,
    opciones: { cause?: unknown } = {},
  ) {
    const [status, mensaje] = ERRORES_SEGUIMIENTO_INDIVIDUAL[codigo];
    super({ status, codigo, mensaje }, status, { cause: opciones.cause });
  }
}
