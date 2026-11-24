import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../../../shared/presentation/guards/role-guard';
import { SessionScopeGuard } from '../../../usuarios/presentation/guards/session-scope.guard';
import { AuditarConsultaTrazabilidadService } from '../../application/services/auditar-consulta-trazabilidad.service';
import {
  MENSAJE_FALLO_AUDITORIA,
  consultaAuditada,
  resultadoDeError,
} from '../http/auditoria-consulta-trazabilidad';

/**
 * Ejecuta, sin cambiarlos, SessionScopeGuard (alcance COMPLETA) y RolesGuard
 * (rol ADMINISTRATIVO) y, si deniegan, registra la consulta como DENEGADA
 * (RF-123) antes de devolver el 403. Debe ir después de SessionAuthGuard.
 */
@Injectable()
export class AutorizacionAdministrativaAuditadaGuard implements CanActivate {
  private readonly logger = new Logger(
    AutorizacionAdministrativaAuditadaGuard.name,
  );
  private readonly alcance: SessionScopeGuard;
  private readonly roles: RolesGuard;

  constructor(
    private readonly reflector: Reflector,
    private readonly auditar: AuditarConsultaTrazabilidadService,
  ) {
    this.alcance = new SessionScopeGuard(reflector);
    this.roles = new RolesGuard(reflector);
  }

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    try {
      if (
        this.alcance.canActivate(contexto) &&
        this.roles.canActivate(contexto)
      )
        return true;
      throw new ForbiddenException();
    } catch (error) {
      if (error instanceof ForbiddenException)
        await this.registrarDenegada(contexto, error);
      throw error;
    }
  }

  private async registrarDenegada(
    contexto: ExecutionContext,
    error: ForbiddenException,
  ): Promise<void> {
    const consulta = consultaAuditada(this.reflector, contexto);
    const registrada =
      consulta !== null &&
      (await this.auditar.registrarNoExitosa(
        consulta,
        'DENEGADA',
        resultadoDeError(error),
      ));
    if (!registrada)
      this.logger.error({
        mensaje: MENSAJE_FALLO_AUDITORIA,
        operacion: consulta?.operacion ?? null,
        estado: 'DENEGADA',
      });
  }
}
