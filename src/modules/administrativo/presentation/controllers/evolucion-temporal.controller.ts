import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Query,
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
import { ConsultarEvolucionTemporalUseCase } from '../../application/use-cases/consultar-evolucion-temporal.use-case';
import { contextoAuditoria } from '../http/contexto-auditoria';

@Controller('admin/cohortes/:id_cohorte/evolucion')
@Roles(Rol.ADMINISTRATIVO)
@AlcancesSesion(AlcanceSesion.COMPLETA)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
export class EvolucionTemporalController {
  constructor(private readonly consultar: ConsultarEvolucionTemporalUseCase) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  obtener(
    @Param('id_cohorte', ParseUUIDPipe) idCohorte: string,
    @Req() request: AuthenticatedSessionRequest,
    @Query() parametros: Record<string, unknown>,
  ) {
    if (Object.keys(parametros).length > 0) {
      throw new BadRequestException({
        statusCode: 400,
        codigo: 'FILTROS_RF135_NO_DISPONIBLES',
        mensaje: 'Los filtros de evolución temporal aún no están disponibles.',
      });
    }
    return this.consultar.ejecutar(contextoAuditoria(request), idCohorte);
  }
}
