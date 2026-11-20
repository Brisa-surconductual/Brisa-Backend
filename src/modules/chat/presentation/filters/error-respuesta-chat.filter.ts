import { ArgumentsHost, Catch, UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';
import { CsrfTokenInvalidoException } from '../../../usuarios/domain/exeption/csrf-token-invalido.exception';
import { RespuestaUsuarioInvalida } from '../../domain/exceptions/respuesta.exceptions';
import { ErrorContratoChatFilter } from './error-contrato-chat.filter';

/** Añade el campo de la respuesta sin alterar el filtro compartido con RF-26. */
@Catch()
export class ErrorRespuestaChatFilter extends ErrorContratoChatFilter {
  override catch(error: unknown, host: ArgumentsHost): void {
    if (
      error instanceof UnauthorizedException ||
      error instanceof CsrfTokenInvalidoException
    ) {
      const statusCode = error.getStatus();
      host
        .switchToHttp()
        .getResponse<Response>()
        .status(statusCode)
        .json({
          statusCode,
          codigo: statusCode === 401 ? 'NO_AUTENTICADO' : 'CSRF_INVALIDO',
          mensaje: error.message,
        });
      return;
    }
    if (!(error instanceof RespuestaUsuarioInvalida)) {
      super.catch(error, host);
      return;
    }
    host.switchToHttp().getResponse<Response>().status(400).json({
      statusCode: 400,
      codigo: error.codigo,
      mensaje: error.message,
      campo: error.campo,
    });
  }
}
