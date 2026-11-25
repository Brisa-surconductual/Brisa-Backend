import { ConflictException } from '@nestjs/common';

/** Hay más de una cohorte activa y el panel no puede elegir una (RF-140). */
export class CohorteActivaAmbiguaException extends ConflictException {
  constructor() {
    super({
      statusCode: 409,
      codigo: 'COHORTE_ACTIVA_AMBIGUA',
      mensaje:
        'Hay más de una cohorte activa. Revise la gestión de cohortes para determinar cuál corresponde al panel principal.',
    });
  }
}
