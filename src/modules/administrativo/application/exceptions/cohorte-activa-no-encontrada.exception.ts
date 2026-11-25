import { NotFoundException } from '@nestjs/common';

/**
 * La cohorte consultada no existe o no está activa (RF-132 a RF-134, RF-141).
 * El mensaje depende de la vista que se intentaba mostrar.
 */
export class CohorteActivaNoEncontradaException extends NotFoundException {
  constructor(mensaje: string) {
    super({
      statusCode: 404,
      codigo: 'COHORTE_ACTIVA_NO_ENCONTRADA',
      mensaje,
    });
  }
}
