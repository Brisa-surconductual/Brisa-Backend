import { HttpException } from '@nestjs/common';
import type { AdministrativoDomainException } from '../../domain/exceptions/domain.exception';

const ERRORES_PERMISO_INDIVIDUAL = {
  PARAMETRO_INVALIDO: [400, 'Los parámetros de la operación no son válidos.'],
  PARTICIPANTE_NO_ENCONTRADO: [404, 'El participante seleccionado no existe.'],
  PERMISO_NO_ENCONTRADO: [404, 'El permiso solicitado no existe.'],
  PERMISO_YA_VIGENTE: [409, 'Ya existe un permiso vigente con ese alcance.'],
  PERMISO_YA_REVOCADO: [409, 'El permiso ya fue revocado.'],
  AUTOCONCESION_NO_PERMITIDA: [422, 'No puede concederse permisos a sí mismo.'],
  ROL_INVALIDO_PARA_OPERACION: [
    422,
    'El usuario indicado no tiene un rol válido para esta operación.',
  ],
  VIGENCIA_INVALIDA: [
    422,
    'La fecha de fin de vigencia debe ser posterior al momento actual.',
  ],
  ERROR_PERSISTENCIA_PERMISOS: [
    500,
    'No fue posible completar la operación sobre el permiso individual.',
  ],
} as const;

export type CodigoErrorPermisoIndividual =
  keyof typeof ERRORES_PERMISO_INDIVIDUAL;

const esCodigo = (codigo: string): codigo is CodigoErrorPermisoIndividual =>
  codigo in ERRORES_PERMISO_INDIVIDUAL;

/** Errores de otorgamiento, consulta y revocación de permisos individuales (RF-04). */
export class PermisoIndividualException extends HttpException {
  constructor(
    readonly codigo: CodigoErrorPermisoIndividual,
    opciones: { cause?: unknown } = {},
  ) {
    const [status, mensaje] = ERRORES_PERMISO_INDIVIDUAL[codigo];
    super({ status, codigo, mensaje }, status, { cause: opciones.cause });
  }

  static desdeDominio(
    error: AdministrativoDomainException,
  ): PermisoIndividualException {
    return new PermisoIndividualException(
      esCodigo(error.codigo) ? error.codigo : 'ERROR_PERSISTENCIA_PERMISOS',
      { cause: error },
    );
  }
}
