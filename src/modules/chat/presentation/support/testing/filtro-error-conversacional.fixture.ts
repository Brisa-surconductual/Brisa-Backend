import type { INestApplication } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ErrorConversacionalFilter } from '../../filters/error-conversacional.filter';

export function instalarFiltroConversacionalPrueba(
  app: Pick<INestApplication, 'get' | 'useGlobalFilters'>,
): void {
  app.useGlobalFilters(
    new ErrorConversacionalFilter(
      {
        registrarBackend: () => Promise.resolve(),
        registrarCliente: () => Promise.resolve('REGISTRADO'),
      },
      app.get(HttpAdapterHost),
    ),
  );
}
