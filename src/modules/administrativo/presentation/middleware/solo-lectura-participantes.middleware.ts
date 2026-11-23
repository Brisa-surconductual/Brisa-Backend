import { HttpStatus, Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { Rol } from '../../../usuarios/domain/enums/rol.enum';
import { SesionNoActivaException } from '../../../usuarios/domain/exeption/sesion-no-activa.exception';
import { SessionAuthGuard } from '../../../usuarios/presentation/guards/session-auth.guard';
import { AuditoriaService } from '../../application/services/auditoria.service';
import { contextoAuditoria } from '../http/contexto-auditoria';
import {
  esMetodoDeEscritura,
  identificarRecursoParticipante,
} from '../http/recursos-de-participante';

function esConsultaConEscritura(request: Request): boolean {
  return (
    request.method === 'GET' &&
    (Number(request.get('Content-Length')) > 0 ||
      request.get('Transfer-Encoding') !== undefined ||
      request.get('X-HTTP-Method-Override') !== undefined ||
      Object.keys(request.query).some((clave) =>
        ['override', '_method'].includes(clave.toLowerCase()),
      ))
  );
}

@Injectable()
export class SoloLecturaParticipantesMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SoloLecturaParticipantesMiddleware.name);

  constructor(
    private readonly sessionAuth: SessionAuthGuard,
    private readonly auditoria: AuditoriaService,
  ) {}

  async use(request: Request, response: Response, next: NextFunction) {
    const escritura = esMetodoDeEscritura(request.method);
    if (!escritura && !esConsultaConEscritura(request)) return next();

    const recurso = identificarRecursoParticipante(request.path);
    if (!recurso) return next();

    try {
      const autenticacion =
        await this.sessionAuth.verificarSinRegistrarActividad(request);
      if (autenticacion.usuario.rol !== Rol.ADMINISTRATIVO) return next();

      this.logger.warn(
        `INTENTO_ESCRITURA_BLOQUEADO ${request.method} ${recurso.recurso}`,
      );
      await this.auditoria.registrarIntento(
        contextoAuditoria(request, autenticacion),
        {
          ...recurso,
          accion: 'INTENTO_ESCRITURA_BLOQUEADO',
          detalle: { metodo: request.method, uri: request.path },
        },
        'DENEGADA',
      );
      const status = escritura ? HttpStatus.FORBIDDEN : HttpStatus.BAD_REQUEST;
      response
        .set('Cache-Control', 'no-store')
        .status(status)
        .json({
          status,
          codigo: escritura ? 'ESCRITURA_NO_PERMITIDA' : 'PARAMETRO_INVALIDO',
          mensaje: escritura
            ? 'Esta información es de solo lectura para el rol administrativo.'
            : 'La solicitud contiene datos no válidos para una consulta de solo lectura.',
        });
    } catch (error) {
      if (error instanceof SesionNoActivaException) return next();
      next(error);
    }
  }
}
