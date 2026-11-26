import { HttpException } from '@nestjs/common';
import type { AdministrativoDomainException } from '../../domain/exceptions/domain.exception';

const ERRORES_GESTION_ALERTA = {
  ALERTA_NO_ENCONTRADA: [
    404,
    'La alerta especificada no existe en el sistema.',
  ],
  ALERTA_YA_ATENDIDA: [
    409,
    'La alerta ya se encuentra registrada como atendida y no puede ser modificada.',
  ],
  ALERTA_NO_ACTIVA: [
    409,
    'La alerta no se encuentra activa y no puede marcarse como atendida.',
  ],
  MOTIVO_INVALIDO: [
    422,
    'El motivo es obligatorio y debe tener entre 10 y 500 caracteres.',
  ],
  COHORTE_NO_ENCONTRADA: [
    404,
    'La cohorte solicitada no existe en el sistema.',
  ],
  M05_NO_DISPONIBLE: [
    503,
    'El módulo de seguimiento no se encuentra disponible en este momento.',
  ],
  ERROR_TRANSACCION: [
    500,
    'No fue posible registrar la acción. La alerta conserva su estado.',
  ],
} as const;

export type CodigoErrorGestionAlerta = keyof typeof ERRORES_GESTION_ALERTA;

const esCodigo = (codigo: string): codigo is CodigoErrorGestionAlerta =>
  codigo in ERRORES_GESTION_ALERTA;

/**
 * Errores de la bandeja de alertas pendientes (RF-146) y de "marcar alerta
 * como atendida" (RF-147), con cuerpo `{ status, codigo, mensaje }`.
 */
export class GestionAlertaException extends HttpException {
  constructor(
    readonly codigo: CodigoErrorGestionAlerta,
    opciones: { cause?: unknown } = {},
  ) {
    const [status, mensaje] = ERRORES_GESTION_ALERTA[codigo];
    super({ status, codigo, mensaje }, status, { cause: opciones.cause });
  }

  static desdeDominio(
    error: AdministrativoDomainException,
  ): GestionAlertaException {
    return new GestionAlertaException(
      esCodigo(error.codigo) ? error.codigo : 'ERROR_TRANSACCION',
      { cause: error },
    );
  }
}
