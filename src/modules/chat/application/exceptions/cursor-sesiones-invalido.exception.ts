import { BadRequestException } from '@nestjs/common';

/** RF-38 (M-8): el cursor no lo generó este servicio o está alterado. */
export class CursorSesionesInvalidoException extends BadRequestException {
  constructor() {
    super({
      codigo: 'PARAMETRO_INVALIDO',
      mensaje: 'El cursor de paginación no es válido.',
    });
  }
}
