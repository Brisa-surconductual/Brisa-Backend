import { UnprocessableEntityException } from '@nestjs/common';

export class HistorialConversacionalInconsistenteException extends UnprocessableEntityException {
  constructor() {
    super({
      codigo: 'HISTORIAL_INCONSISTENTE',
      mensaje: 'El historial conversacional presenta inconsistencias.',
    });
  }
}
