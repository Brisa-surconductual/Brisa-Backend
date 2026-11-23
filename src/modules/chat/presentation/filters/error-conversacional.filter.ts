import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { isUUID } from 'class-validator';
import type { Response } from 'express';
import { CsrfTokenInvalidoException } from '../../../usuarios/domain/exeption/csrf-token-invalido.exception';
import type { AuthenticatedSessionRequest } from '../../../usuarios/presentation/http/authenticated-session-request';
import { VENTANA_REPORTES_CLIENTE_SEGUNDOS } from '../../application/errores-conversacionales';
import { DomainException } from '../../domain/exceptions/domain.exception';
import { RespuestaUsuarioInvalida } from '../../domain/exceptions/respuesta.exceptions';
import { RegistroErroresConversacionalesRepository } from '../../domain/repositories/registro-errores-conversacionales.repository';
import { obtenerIdPeticionChat } from '../http/id-peticion-chat';
import {
  esCodigoConversacional,
  mensajeErrorConversacional,
} from './catalogo-errores-conversacionales';
import {
  DomainExceptionFilter,
  HTTP_ERRORES_DOMINIO,
} from './domain-exception.filter';

type Contrato =
  | 'iniciar'
  | 'respuestas'
  | 'nodo-actual'
  | 'historial'
  | 'errores-cliente'
  | 'sos';

const CAMPOS_RESPUESTA = new Set([
  'valor',
  'id_interaccion',
  'id_nodo',
  'secuencia',
  'tipo_entrada',
  'timestamp_interaccion',
  'estado_conectividad',
  'recursos_no_presentados',
]);

function contratoConversacional(
  solicitud: AuthenticatedSessionRequest,
): Contrato | null {
  const ruta = solicitud.path.replace(/\/$/u, '').toLowerCase();
  if (solicitud.method === 'POST') {
    if (ruta === '/chat/errores-cliente') return 'errores-cliente';
    if (ruta === '/chat/sesiones/iniciar') return 'iniciar';
    if (/^\/chat\/sesiones\/[^/]+\/respuestas$/u.test(ruta))
      return 'respuestas';
    // RF-43: protocolo SOS del estudiante.
    if (
      ruta === '/chat/sos/activar' ||
      /^\/chat\/sos\/[^/]+\/finalizar$/u.test(ruta)
    )
      return 'sos';
  }
  if (solicitud.method === 'GET' || solicitud.method === 'HEAD') {
    if (/^\/chat\/sesiones\/[^/]+\/nodo-actual$/u.test(ruta))
      return 'nodo-actual';
    if (/^\/chat\/sesiones\/[^/]+\/historial$/u.test(ruta)) return 'historial';
  }
  return null;
}

function uuid(valor: unknown): string | null {
  return typeof valor === 'string' && isUUID(valor) ? valor : null;
}

@Catch()
export class ErrorConversacionalFilter implements ExceptionFilter {
  private readonly dominio = new DomainExceptionFilter();
  private readonly logger = new Logger(ErrorConversacionalFilter.name);

  constructor(
    private readonly registro: RegistroErroresConversacionalesRepository,
    private readonly adaptador: HttpAdapterHost,
  ) {}

  async catch(error: unknown, host: ArgumentsHost): Promise<void> {
    if (host.getType() !== 'http') throw error;
    const solicitud = host
      .switchToHttp()
      .getRequest<AuthenticatedSessionRequest>();
    const contrato = contratoConversacional(solicitud);
    if (contrato === null) {
      if (error instanceof DomainException) this.dominio.catch(error, host);
      else
        new BaseExceptionFilter(this.adaptador.httpAdapter).catch(error, host);
      return;
    }

    const respuesta = host.switchToHttp().getResponse<Response>();
    const xRequestId = obtenerIdPeticionChat(solicitud, respuesta);
    const detalle = this.clasificar(error, contrato);
    // Los rechazos de la propia telemetría no pueden consumir almacenamiento de reportes.
    if (contrato !== 'errores-cliente' || detalle.statusCode >= 500) {
      try {
        await this.registro.registrarBackend({
          xRequestId,
          codigo: detalle.codigo ?? `HTTP_${detalle.statusCode}`,
          statusHttp: detalle.statusCode,
          idUsuario: uuid(solicitud.autenticacion?.usuario.id_usuario),
          idSesion: uuid(
            solicitud.params?.id_sesion ?? solicitud.params?.idSesion,
          ),
        });
      } catch {
        this.logger.warn({
          mensaje: 'No se pudo registrar el error conversacional.',
          xRequestId,
          codigo: detalle.codigo,
          statusCode: detalle.statusCode,
        });
      }
    }

    if (respuesta.headersSent) return;
    if (detalle.codigo === 'LIMITE_REPORTES')
      respuesta.setHeader(
        'Retry-After',
        String(VENTANA_REPORTES_CLIENTE_SEGUNDOS),
      );
    respuesta.status(detalle.statusCode).json(detalle);
  }

  private clasificar(error: unknown, contrato: Contrato) {
    const status =
      error instanceof DomainException
        ? HTTP_ERRORES_DOMINIO[error.tipo].statusCode
        : error instanceof HttpException
          ? error.getStatus()
          : 500;
    const statusCode = status >= 400 && status <= 599 ? status : 500;
    const cuerpo = error instanceof HttpException ? error.getResponse() : null;
    const datos =
      typeof cuerpo === 'object' && cuerpo !== null
        ? (cuerpo as { codigo?: unknown; campo?: unknown })
        : {};
    const codigoInterno =
      error instanceof DomainException ? error.codigo : datos.codigo;

    let codigo = esCodigoConversacional(codigoInterno) ? codigoInterno : null;
    if (error instanceof CsrfTokenInvalidoException) codigo = 'CSRF_INVALIDO';
    else if (codigo === null && statusCode === 401 && contrato === 'respuestas')
      codigo = 'NO_AUTENTICADO';
    else if (
      codigo === null &&
      statusCode === 400 &&
      (contrato === 'historial' ||
        contrato === 'errores-cliente' ||
        contrato === 'sos')
    )
      codigo = 'PARAMETRO_INVALIDO';
    else if (
      codigo === null &&
      statusCode === 500 &&
      (contrato === 'historial' ||
        contrato === 'nodo-actual' ||
        contrato === 'respuestas')
    )
      codigo = 'CONTENIDO_NO_DISPONIBLE';

    const campo =
      error instanceof RespuestaUsuarioInvalida ? error.campo : datos.campo;
    return {
      statusCode,
      codigo,
      mensaje: mensajeErrorConversacional(
        statusCode,
        codigo,
        contrato === 'iniciar',
      ),
      ...(contrato === 'respuestas' &&
        typeof campo === 'string' &&
        CAMPOS_RESPUESTA.has(campo) && { campo }),
    };
  }
}
