import {
  Body,
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../../../shared/presentation/guards/role-guard';
import { AlcanceSesion } from '../../../../usuarios/domain/enums/alcance-sesion.enum';
import { Rol } from '../../../../usuarios/domain/enums/rol.enum';
import { AlcancesSesion } from '../../../../usuarios/presentation/decorators/alcances-sesion.decorator';
import { CsrfSessionGuard } from '../../../../usuarios/presentation/guards/csrf-session.guard';
import { SessionAuthGuard } from '../../../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../../../usuarios/presentation/guards/session-scope.guard';
import type { AuthenticatedSessionRequest } from '../../../../usuarios/presentation/http/authenticated-session-request';
import type { AlertaAtendidaDtoResponse } from '../../../application/dto/gestion-alertas/alerta-atendida.dto-response';
import {
  AlertaParticipanteDtoRequest,
  MarcarAlertaAtendidaDtoRequest,
} from '../../../application/dto/gestion-alertas/marcar-alerta-atendida.dto-request';
import { MarcarAlertaAtendidaUseCase } from '../../../application/use-cases/gestion-alertas/marcar-alerta-atendida.use-case';
import { AlcancePermiso } from '../../../domain/enums/alcance-permiso.enum';
import { RequierePermisoIndividual } from '../../decorators/requiere-permiso-individual.decorator';
import { contextoAuditoria } from '../../http/contexto-auditoria';

/** RF-147 FA1. */
export const MENSAJE_SIN_PERMISO_GESTION_ALERTAS =
  'Acceso denegado. No cuenta con los privilegios necesarios para gestionar alertas.';

/**
 * RF-147: marcar una alerta de un participante como atendida, con motivo
 * obligatorio. Es la única escritura administrativa permitida sobre
 * `/admin/participantes` (ver `recursos-de-participante.ts`).
 */
@Controller('admin/participantes/:codigo_participante/alertas')
@Roles(Rol.ADMINISTRATIVO, Rol.COORDINADOR_PSI)
@AlcancesSesion(AlcanceSesion.COMPLETA)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
export class GestionAlertasController {
  constructor(private readonly marcarAtendida: MarcarAlertaAtendidaUseCase) {}

  @Post(':id_alerta/atender')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @UseGuards(CsrfSessionGuard)
  @RequierePermisoIndividual(AlcancePermiso.ACCESO_INDIVIDUAL, {
    mensaje: MENSAJE_SIN_PERMISO_GESTION_ALERTAS,
  })
  atender(
    @Param() params: AlertaParticipanteDtoRequest,
    @Body() dto: MarcarAlertaAtendidaDtoRequest,
    @Req() request: AuthenticatedSessionRequest,
  ): Promise<AlertaAtendidaDtoResponse> {
    return this.marcarAtendida.execute(
      contextoAuditoria(request),
      params.codigo_participante,
      params.id_alerta,
      dto.motivo,
    );
  }
}
