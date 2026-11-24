import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  Observable,
  catchError,
  concatMap,
  from,
  mergeMap,
  throwError,
} from 'rxjs';
import {
  AuditarConsultaTrazabilidadService,
  ConsultaTrazabilidadAuditada,
} from '../../application/services/auditar-consulta-trazabilidad.service';
import {
  MENSAJE_FALLO_AUDITORIA,
  consultaAuditada,
  resultadoDeError,
} from '../http/auditoria-consulta-trazabilidad';

/**
 * RF-123 para las consultas de RF-38 que superaron la autorización:
 * - éxito: registra EXITOSA ANTES de entregar los datos; si no se puede
 *   registrar, la consulta se bloquea con 500 y no se envía nada;
 * - error (validación, 404, 422, 500…): registra FALLIDA y devuelve el mismo
 *   error; si el registro falla, solo se deja constancia en el log.
 */
@Injectable()
export class AuditoriaConsultaTrazabilidadInterceptor implements NestInterceptor {
  private readonly logger = new Logger(
    AuditoriaConsultaTrazabilidadInterceptor.name,
  );

  constructor(
    private readonly reflector: Reflector,
    private readonly auditar: AuditarConsultaTrazabilidadService,
  ) {}

  intercept(
    contexto: ExecutionContext,
    siguiente: CallHandler,
  ): Observable<unknown> {
    const consulta = consultaAuditada(this.reflector, contexto);
    if (consulta === null) {
      // Sin actor completo no hay registro posible: no se consulta nada.
      this.logger.error({ mensaje: MENSAJE_FALLO_AUDITORIA, estado: null });
      return throwError(() => new InternalServerErrorException());
    }

    return siguiente.handle().pipe(
      catchError((error: unknown) =>
        from(this.registrarFallida(consulta, error)).pipe(
          mergeMap(() => throwError(() => error)),
        ),
      ),
      concatMap((datos: unknown) =>
        from(this.registrarExitosa(consulta).then(() => datos)),
      ),
    );
  }

  private async registrarExitosa(
    consulta: ConsultaTrazabilidadAuditada,
  ): Promise<void> {
    try {
      await this.auditar.registrarExitosa(consulta);
    } catch {
      this.logger.error({
        mensaje: MENSAJE_FALLO_AUDITORIA,
        operacion: consulta.operacion,
        estado: 'EXITOSA',
      });
      throw new InternalServerErrorException();
    }
  }

  private async registrarFallida(
    consulta: ConsultaTrazabilidadAuditada,
    error: unknown,
  ): Promise<void> {
    const resultado = resultadoDeError(error);
    if (
      !(await this.auditar.registrarNoExitosa(consulta, 'FALLIDA', resultado))
    )
      this.logger.error({
        mensaje: MENSAJE_FALLO_AUDITORIA,
        operacion: consulta.operacion,
        estado: 'FALLIDA',
        estadoHttp: resultado.estadoHttp,
      });
  }
}
