import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../../shared/presentation/guards/role-guard';
import { AlcanceSesion } from '../../../usuarios/domain/enums/alcance-sesion.enum';
import { Rol } from '../../../usuarios/domain/enums/rol.enum';
import { AlcancesSesion } from '../../../usuarios/presentation/decorators/alcances-sesion.decorator';
import { SessionAuthGuard } from '../../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../../usuarios/presentation/guards/session-scope.guard';
import type { AuthenticatedSessionRequest } from '../../../usuarios/presentation/http/authenticated-session-request';
import { ConsultarVistaNarrativaUseCase } from '../../application/use-cases/consultar-vista-narrativa.use-case';
import { ConsultarVistaNotificacionesUseCase } from '../../application/use-cases/consultar-vista-notificaciones.use-case';
import { contextoAuditoria } from '../http/contexto-auditoria';

@Controller('admin/cohortes/:id_cohorte/vistas')
@Roles(Rol.ADMINISTRATIVO, Rol.COORDINADOR_PSI)
@AlcancesSesion(AlcanceSesion.COMPLETA)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
export class VistasAgregadasController {
  constructor(
    private readonly narrativa: ConsultarVistaNarrativaUseCase,
    private readonly notificaciones: ConsultarVistaNotificacionesUseCase,
  ) {}

  @Get('narrativa')
  @Header('Cache-Control', 'no-store')
  obtenerNarrativa(
    @Param('id_cohorte', ParseUUIDPipe) idCohorte: string,
    @Req() request: AuthenticatedSessionRequest,
  ) {
    return this.narrativa.ejecutar(contextoAuditoria(request), idCohorte);
  }

  @Get('notificaciones')
  @Header('Cache-Control', 'no-store')
  obtenerNotificaciones(
    @Param('id_cohorte', ParseUUIDPipe) idCohorte: string,
    @Req() request: AuthenticatedSessionRequest,
  ) {
    return this.notificaciones.ejecutar(contextoAuditoria(request), idCohorte);
  }
}
