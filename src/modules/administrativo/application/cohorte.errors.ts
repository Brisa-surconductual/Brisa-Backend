import { HttpException } from '@nestjs/common';

const ERRORES = {
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
  ROL_INVALIDO: [403, 'No tiene permisos para gestionar cohortes.'],
  ERROR_PERSISTENCIA_COHORTE: [
    500,
    'No fue posible guardar la cohorte en este momento.',
  ],
} as const;

export type CodigoErrorCohorte = keyof typeof ERRORES;

export function errorCohorte(codigo: CodigoErrorCohorte, cause?: unknown) {
  const [statusCode, mensaje] = ERRORES[codigo];
  return new HttpException({ statusCode, codigo, mensaje }, statusCode, {
    cause,
  });
}
