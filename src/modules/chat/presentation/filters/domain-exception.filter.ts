import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import {
  DomainException,
  TipoErrorDominio,
} from '../../domain/exceptions/domain.exception';

const RESPUESTA_HTTP: Record<
  TipoErrorDominio,
  { statusCode: number; error: string }
> = {
  NO_ENCONTRADO: { statusCode: 404, error: 'Not Found' },
  CONFLICTO: { statusCode: 409, error: 'Conflict' },
  NO_PROCESABLE: { statusCode: 422, error: 'Unprocessable Entity' },
  SOLICITUD_INVALIDA: { statusCode: 400, error: 'Bad Request' },
  PROHIBIDO: { statusCode: 403, error: 'Forbidden' },
};

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost): void {
    const { statusCode, error } = RESPUESTA_HTTP[exception.tipo];

    host
      .switchToHttp()
      .getResponse<Response>()
      .status(statusCode)
      .json({
        statusCode,
        error,
        ...(exception.codigo !== undefined && { codigo: exception.codigo }),
        message: exception.message,
        ...(exception.detalles !== undefined && {
          detalles: exception.detalles,
        }),
      });
  }
}
