import { HttpException } from '@nestjs/common';
import type { AdministrativoDomainException } from '../../domain/exceptions/domain.exception';

const ERRORES_COHORTE = {
  ERROR_CONSULTA_COHORTE: [
    500,
    'No fue posible consultar las cohortes en este momento.',
  ],
  NOMBRE_COHORTE_DUPLICADO: [
    409,
    'Ya existe una cohorte vigente con ese nombre.',
  ],
  COHORTE_SIN_CAMBIOS: [
    400,
    'Envía al menos un campo para actualizar la cohorte.',
  ],
  COHORTE_NO_ENCONTRADA: [404, 'La cohorte seleccionada no existe.'],
  NOMBRE_COHORTE_INVALIDO: [
    400,
    'El nombre de la cohorte no puede estar vacío.',
  ],
  FECHAS_COHORTE_INVALIDAS: [
    400,
    'La fecha de finalización del programa no puede ser anterior a la fecha de inicio.',
  ],
  CRONOGRAMA_NO_ENCONTRADO: [
    404,
    'El cronograma psicoeducativo seleccionado no existe.',
  ],
  CRONOGRAMA_NO_ACTIVO: [
    422,
    'La cohorte debe asociarse a un cronograma psicoeducativo activo.',
  ],
  TRANSICION_COHORTE_INVALIDA: [
    409,
    'La cohorte ya no está en un estado que permita esta acción.',
  ],
  PARTICIPANTE_EN_OTRA_COHORTE_ACTIVA: [
    409,
    'No se puede activar la cohorte porque uno o más participantes pertenecen a otra cohorte activa.',
  ],
  ROL_INVALIDO: [403, 'No tiene permisos para gestionar cohortes.'],
  ERROR_PERSISTENCIA_COHORTE: [
    500,
    'No fue posible guardar la cohorte en este momento.',
  ],
} as const;

export type CodigoErrorCohorte = keyof typeof ERRORES_COHORTE;

function esCodigoErrorCohorte(codigo: string): codigo is CodigoErrorCohorte {
  return Object.hasOwn(ERRORES_COHORTE, codigo);
}

/** Errores de gestión y consulta de cohortes (RF-124). */
export class CohorteException extends HttpException {
  constructor(codigo: CodigoErrorCohorte, cause?: unknown) {
    const [statusCode, mensaje] = ERRORES_COHORTE[codigo];
    super({ statusCode, codigo, mensaje }, statusCode, { cause });
  }

  /** Traduce una regla de dominio incumplida a su respuesta HTTP vigente. */
  static desdeDominio(error: AdministrativoDomainException): CohorteException {
    return esCodigoErrorCohorte(error.codigo)
      ? new CohorteException(error.codigo)
      : new CohorteException('ERROR_PERSISTENCIA_COHORTE', error);
  }
}
