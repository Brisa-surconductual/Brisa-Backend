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
import { ConsultarVistaConductualUseCase } from '../../application/use-cases/consultar-vista-conductual.use-case';
import { contextoAuditoria } from '../http/contexto-auditoria';

@Controller('admin/cohortes/:id_cohorte/vista-agregada')
@Roles(Rol.ADMINISTRATIVO, Rol.COORDINADOR_PSI)
@AlcancesSesion(AlcanceSesion.COMPLETA)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
export class VistaConductualController {
  constructor(private readonly consultar: ConsultarVistaConductualUseCase) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  obtener(
    @Param('id_cohorte', ParseUUIDPipe) idCohorte: string,
    @Req() request: AuthenticatedSessionRequest,
  ) {
    return this.consultar.ejecutar(contextoAuditoria(request), idCohorte);
  }
}
