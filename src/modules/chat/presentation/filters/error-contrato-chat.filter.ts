import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { Response } from 'express';
import { CsrfTokenInvalidoException } from '../../../usuarios/domain/exeption/csrf-token-invalido.exception';
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
  protected readonly codigoSolicitudInvalida: string | null = null;
  protected readonly errorInterno: { codigo: string | null; mensaje: string } =
    {
      codigo: 'CONTENIDO_NO_DISPONIBLE',
      mensaje: 'El contenido del nodo no está disponible.',
    };

  catch(error: unknown, host: ArgumentsHost): void {
    let statusCode = 500;
    let { codigo, mensaje } = this.errorInterno;
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
        codigo = datos.codigo ?? this.codigoHttpPredeterminado(statusCode);
        mensaje =
          datos.mensaje ??
          (Array.isArray(datos.message)
            ? datos.message.join(' ')
            : datos.message) ??
          error.message;
      } else {
        codigo = this.codigoHttpPredeterminado(statusCode);
        mensaje = body;
      }
    }
    if (error instanceof CsrfTokenInvalidoException) codigo = 'CSRF_INVALIDO';
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(statusCode)
      .json({ statusCode, codigo, mensaje });
  }

  private codigoHttpPredeterminado(estado: number): string | null {
    return estado === 400 ? this.codigoSolicitudInvalida : null;
  }
}

@Catch()
export class ErrorHistorialChatFilter extends ErrorContratoChatFilter {
  protected readonly codigoSolicitudInvalida = 'PARAMETRO_INVALIDO';
}

@Catch()
export class ErrorInicioSesionChatFilter extends ErrorContratoChatFilter {
  protected readonly errorInterno = {
    codigo: null,
    mensaje:
      'No fue posible recuperar la sesión en este momento. Intente nuevamente más tarde.',
  };
}
