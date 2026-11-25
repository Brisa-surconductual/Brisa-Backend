import { InternalServerErrorException } from '@nestjs/common';

/** La acción no pudo conservarse en la bitácora de auditoría (RF-123). */
export class RegistroAuditoriaException extends InternalServerErrorException {
  constructor() {
    super({
      statusCode: 500,
      codigo: 'ERROR_REGISTRO_AUDITORIA',
      mensaje:
        'No fue posible registrar la acción en la bitácora de auditoría.',
    });
  }
}
