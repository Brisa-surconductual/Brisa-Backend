import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { Response } from 'express';
import { DomainException } from '../../domain/exceptions/domain.exception';

const ESTADOS = {
  NO_ENCONTRADO: 404,
  CONFLICTO: 409,
  NO_PROCESABLE: 422,
  SOLICITUD_INVALIDA: 400,
  PROHIBIDO: 403,
} as const;

/** Adaptador de errores del contrato del estudiante; no altera los guards globales. */
@Catch()
export class ErrorContratoChatFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    let statusCode = 500;
    let codigo: string | null = 'CONTENIDO_NO_DISPONIBLE';
    let mensaje = 'El contenido del nodo no está disponible.';
    if (error instanceof DomainException) {
      statusCode = ESTADOS[error.tipo];
      codigo = error.codigo ?? null;
      mensaje = error.message;
    } else if (error instanceof HttpException) {
      statusCode = error.getStatus();
      const body = error.getResponse();
      if (typeof body === 'object' && body !== null) {
        const datos = body as {
          codigo?: string;
          message?: string | string[];
          mensaje?: string;
        };
        codigo = datos.codigo ?? null;
        mensaje =
          datos.mensaje ??
          (Array.isArray(datos.message)
            ? datos.message.join(' ')
            : datos.message) ??
          error.message;
      } else {
        codigo = null;
        mensaje = body;
      }
    }
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(statusCode)
      .json({ statusCode, codigo, mensaje });
  }
}
