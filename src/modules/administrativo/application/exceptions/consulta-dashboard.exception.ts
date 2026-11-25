import { InternalServerErrorException } from '@nestjs/common';

/** Fallo técnico al generar el panel principal (RF-140). */
export class ConsultaDashboardException extends InternalServerErrorException {
  constructor(cause?: unknown) {
    super(
      {
        statusCode: 500,
        codigo: 'ERROR_CONSULTA_DASHBOARD',
        mensaje:
          'No fue posible generar el panel principal en este momento. Intente nuevamente más tarde.',
      },
      { cause },
    );
  }
}
