import { InternalServerErrorException } from '@nestjs/common';

/** Fallo técnico al consultar una vista agregada (RF-132 a RF-134). */
export class ConsultaVistaAgregadaException extends InternalServerErrorException {
  constructor(mensaje: string, cause?: unknown) {
    super(
      {
        statusCode: 500,
        codigo: 'ERROR_CONSULTA_VISTA_AGREGADA',
        mensaje,
      },
      { cause },
    );
  }
}
