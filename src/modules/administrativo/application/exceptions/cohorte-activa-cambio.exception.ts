import { ConflictException } from '@nestjs/common';

/** La cohorte activa cambió mientras se armaba el panel (RF-140). */
export class CohorteActivaCambioException extends ConflictException {
  constructor() {
    super({
      statusCode: 409,
      codigo: 'COHORTE_ACTIVA_CAMBIO',
      mensaje:
        'La cohorte activa cambió durante la consulta. Intente nuevamente.',
    });
  }
}
