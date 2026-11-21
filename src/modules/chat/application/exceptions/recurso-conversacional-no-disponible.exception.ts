import { ServiceUnavailableException } from '@nestjs/common';

export class RecursoConversacionalNoDisponibleException extends ServiceUnavailableException {
  constructor() {
    super({ codigo: 'RECURSO_NO_DISPONIBLE' });
  }
}
