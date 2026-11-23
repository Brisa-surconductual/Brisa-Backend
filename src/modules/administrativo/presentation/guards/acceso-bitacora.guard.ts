import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { RolesGuard } from '../../../../shared/presentation/guards/role-guard';
import { SessionAuthGuard } from '../../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../../usuarios/presentation/guards/session-scope.guard';
import type { AuthenticatedSessionRequest } from '../../../usuarios/presentation/http/authenticated-session-request';
import { AuditoriaService } from '../../application/services/auditoria.service';
import { ACCESO_BITACORA, contextoAuditoria } from '../http/contexto-auditoria';

@Injectable()
export class AccesoBitacoraGuard implements CanActivate {
  constructor(
    private readonly auth: SessionAuthGuard,
    private readonly scope: SessionScopeGuard,
    private readonly rol: RolesGuard,
    private readonly auditoria: AuditoriaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      if (
        (await this.auth.canActivate(context)) &&
        this.scope.canActivate(context) &&
        this.rol.canActivate(context)
      )
        return true;
      throw new ForbiddenException();
    } catch (error) {
      const status = error instanceof HttpException ? error.getStatus() : 500;
      const request = context
        .switchToHttp()
        .getRequest<AuthenticatedSessionRequest>();
      await this.auditoria.registrarIntento(
        contextoAuditoria(request),
        ACCESO_BITACORA,
        status === 401 || status === 403 ? 'DENEGADA' : 'FALLIDA',
      );
      if (status === 403)
        throw new ForbiddenException({
          statusCode: 403,
          codigo: 'ACCESO_DENEGADO',
          mensaje: 'No tiene permisos para consultar la bitácora.',
        });
      throw error;
    }
  }
}
