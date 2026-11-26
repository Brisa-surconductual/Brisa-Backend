import { Controller, Get, Header, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../../shared/presentation/guards/role-guard';
import { AlcanceSesion } from '../../../usuarios/domain/enums/alcance-sesion.enum';
import { Rol } from '../../../usuarios/domain/enums/rol.enum';
import { AlcancesSesion } from '../../../usuarios/presentation/decorators/alcances-sesion.decorator';
import { SessionAuthGuard } from '../../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../../usuarios/presentation/guards/session-scope.guard';
import type { AuthenticatedSessionRequest } from '../../../usuarios/presentation/http/authenticated-session-request';
import { ConsultarDashboardPrincipalUseCase } from '../../application/use-cases/consultar-dashboard-principal.use-case';
import { contextoAuditoria } from '../http/contexto-auditoria';

@Controller('admin/dashboard')
@Roles(Rol.ADMINISTRATIVO, Rol.COORDINADOR_PSI)
@AlcancesSesion(AlcanceSesion.COMPLETA)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
export class DashboardPrincipalController {
  constructor(private readonly consultar: ConsultarDashboardPrincipalUseCase) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  obtener(@Req() request: AuthenticatedSessionRequest) {
    return this.consultar.ejecutar(contextoAuditoria(request));
  }
}
