import { InternalServerErrorException } from '@nestjs/common';

/** La evolución temporal no pudo construirse con el agregado recibido (RF-141). */
export class ConstruccionSerieTemporalException extends InternalServerErrorException {
  constructor(cause?: unknown) {
    super(
      {
        statusCode: 500,
        codigo: 'ERROR_CONSTRUCCION_SERIE_TEMPORAL',
        mensaje:
          'No fue posible construir la evolución temporal de indicadores en este momento. Intente nuevamente más tarde.',
      },
      { cause },
    );
  }
}
