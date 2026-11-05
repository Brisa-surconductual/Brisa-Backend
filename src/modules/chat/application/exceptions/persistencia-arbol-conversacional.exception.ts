import { InternalServerErrorException } from '@nestjs/common';

export class PersistenciaArbolConversacionalException extends InternalServerErrorException {
  constructor() {
    super(
      'No fue posible gestionar el árbol conversacional en este momento. Intente nuevamente más tarde.',
    );
  }
}
