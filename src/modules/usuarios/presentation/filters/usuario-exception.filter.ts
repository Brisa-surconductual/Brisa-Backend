import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  AccesoDenegadoException,
  CodigoRecuperacionExpiradoException,
  CodigoRecuperacionInvalidoException,
  ConsentimientoNoDisponibleException,
  ConsentimientoNoVigenteException,
  ConsentimientoRequeridoException,
  ContrasenaDebilException,
  ContrasenasNoCoincidenException,
  CorreoDuplicadoException,
  CorreoInvalidoException,
  CredencialesInvalidasException,
  CuentaInactivaException,
  DatosLineaBaseInvalidosException,
  EstadoRegistroInvalidoException,
  FechasConsumoIncoherentesException,
  LimiteRecuperacionExcedidoException,
  SesionInvalidaException,
} from '../../domain/exceptions/usuario.exceptions';

@Catch()
export class UsuarioExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(UsuarioExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    const mapped = this.mapException(exception);
    if (mapped.status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        exception instanceof Error ? exception.message : 'Unknown error',
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(mapped.status).json({
      statusCode: mapped.status,
      error: HttpStatus[mapped.status],
      message: mapped.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private mapException(exception: unknown): {
    status: HttpStatus;
    message: string;
  } {
    if (exception instanceof CorreoDuplicadoException) {
      return { status: HttpStatus.CONFLICT, message: exception.message };
    }
    if (
      exception instanceof CorreoInvalidoException ||
      exception instanceof ContrasenaDebilException ||
      exception instanceof ContrasenasNoCoincidenException ||
      exception instanceof ConsentimientoRequeridoException ||
      exception instanceof DatosLineaBaseInvalidosException ||
      exception instanceof CodigoRecuperacionInvalidoException ||
      exception instanceof CodigoRecuperacionExpiradoException
    ) {
      return { status: HttpStatus.BAD_REQUEST, message: exception.message };
    }
    if (exception instanceof FechasConsumoIncoherentesException) {
      return { status: HttpStatus.CONFLICT, message: exception.message };
    }
    if (
      exception instanceof CredencialesInvalidasException ||
      exception instanceof CuentaInactivaException ||
      exception instanceof SesionInvalidaException
    ) {
      return { status: HttpStatus.UNAUTHORIZED, message: exception.message };
    }
    if (
      exception instanceof AccesoDenegadoException ||
      exception instanceof ConsentimientoNoVigenteException
    ) {
      return { status: HttpStatus.FORBIDDEN, message: exception.message };
    }
    if (exception instanceof LimiteRecuperacionExcedidoException) {
      return {
        status: HttpStatus.TOO_MANY_REQUESTS,
        message: exception.message,
      };
    }
    if (exception instanceof EstadoRegistroInvalidoException) {
      return { status: HttpStatus.CONFLICT, message: exception.message };
    }
    if (exception instanceof ConsentimientoNoDisponibleException) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message,
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message:
        'No fue posible procesar la solicitud en este momento. Intente nuevamente más tarde.',
    };
  }
}
