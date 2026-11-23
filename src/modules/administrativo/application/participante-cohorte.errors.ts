import { HttpException } from '@nestjs/common';

const ERRORES = {
  COHORTE_NO_ACTIVA: [
    422,
    'Solo se pueden asignar participantes a una cohorte activa.',
  ],
  PARTICIPANTE_NO_ENCONTRADO: [404, 'El participante seleccionado no existe.'],
  PARTICIPANTE_NO_ASIGNADO: [
    404,
    'El participante no tiene una asignación vigente en esta cohorte.',
  ],
  PARTICIPANTE_YA_ASIGNADO: [
    409,
    'El participante ya se encuentra asignado a esta cohorte.',
  ],
  PARTICIPANTE_EN_OTRA_COHORTE_ACTIVA: [
    409,
    'El participante ya pertenece a otra cohorte activa.',
  ],
  PARTICIPANTE_NO_CUMPLE_REQUISITOS: [
    422,
    'El participante no cumple los requisitos para quedar activo.',
  ],
  ERROR_PERSISTENCIA_PARTICIPANTES: [
    500,
    'No fue posible completar la operación de participantes de la cohorte.',
  ],
} as const;

export type CodigoErrorParticipanteCohorte = keyof typeof ERRORES;

export function errorParticipanteCohorte(
  codigo: CodigoErrorParticipanteCohorte,
  opciones: { cause?: unknown; codigoParticipante?: string } = {},
) {
  const [statusCode, mensaje] = ERRORES[codigo];
  const detalles = opciones.codigoParticipante
    ? { codigo_participante: opciones.codigoParticipante }
    : undefined;
  return new HttpException(
    { statusCode, codigo, mensaje, ...(detalles && { detalles }) },
    statusCode,
    { cause: opciones.cause },
  );
}
