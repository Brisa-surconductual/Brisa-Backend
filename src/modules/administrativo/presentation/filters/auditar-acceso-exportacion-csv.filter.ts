import {
  ArgumentsHost,
  Catch,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { isUUID } from 'class-validator';
import { ExportacionCsvException } from '../../application/exceptions/exportacion-csv.exception';
import { AuditoriaService } from '../../application/services/auditoria.service';
import { accionExportacionCohorte } from '../../domain/entities/exportacion-cohorte/exportacion-cohorte.entity';
import type { AuthenticatedSessionRequest } from '../../../usuarios/presentation/http/authenticated-session-request';
import { contextoAuditoria } from '../http/contexto-auditoria';

@Catch(HttpException)
@Injectable()
export class AuditarAccesoExportacionCsvFilter extends BaseExceptionFilter {
  constructor(
    private readonly auditoria: AuditoriaService,
    adapterHost: HttpAdapterHost,
  ) {
    super(adapterHost.httpAdapter);
  }

  catch(exception: HttpException, host: ArgumentsHost): void {
    void this.registrarYResponder(exception, host);
  }

  private async registrarYResponder(
    exception: HttpException,
    host: ArgumentsHost,
  ) {
    const estado = exception.getStatus();
    if (estado === 400 || estado === 401 || estado === 403) {
      const request = host
        .switchToHttp()
        .getRequest<AuthenticatedSessionRequest>();
      const id = request.params.id_cohorte;
      await this.auditoria.registrarIntento(
        contextoAuditoria(request),
        accionExportacionCohorte(
          typeof id === 'string' && isUUID(id) ? id : null,
        ),
        estado === 400 ? 'FALLIDA' : 'DENEGADA',
      );
    }

    super.catch(
      estado === 403
        ? new ExportacionCsvException('ACCESO_DENEGADO')
        : exception,
      host,
    );
  }
}
