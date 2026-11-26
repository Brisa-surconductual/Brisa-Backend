import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
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
import { AlertasPendientesDtoRequest } from '../../../application/dto/gestion-alertas/alertas-pendientes.dto-request';
import type { AlertasPendientesDtoResponse } from '../../../application/dto/gestion-alertas/alertas-pendientes.dto-response';
import { MarcarAlertaAtendidaDtoRequest } from '../../../application/dto/gestion-alertas/marcar-alerta-atendida.dto-request';
import { ListarAlertasPendientesUseCase } from '../../../application/use-cases/gestion-alertas/listar-alertas-pendientes.use-case';
import { MarcarAlertaAtendidaUseCase } from '../../../application/use-cases/gestion-alertas/marcar-alerta-atendida.use-case';
import { contextoAuditoria } from '../../http/contexto-auditoria';
import { responderSinContenido } from '../../http/responder-sin-contenido';

/**
 * Gestión de alertas para evitar la fatiga de alertas:
 * - RF-146: bandeja de alertas pendientes de una cohorte;
 * - RF-147: marcar una alerta como atendida (irreversible, con motivo).
 *
 * Solo exige el rol: la bandeja muestra seudónimo y tipo de alerta, y marcarla
 * no expone datos individuales (sin permiso individual de RF-04).
 */
@Controller('admin')
@Roles(Rol.ADMINISTRATIVO, Rol.COORDINADOR_PSI)
@AlcancesSesion(AlcanceSesion.COMPLETA)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
export class GestionAlertasController {
  constructor(
    private readonly listarPendientes: ListarAlertasPendientesUseCase,
    private readonly marcarAtendida: MarcarAlertaAtendidaUseCase,
  ) {}

  @Get('cohortes/:id_cohorte/alertas/pendientes')
  @Header('Cache-Control', 'no-store')
  async pendientes(
    @Param('id_cohorte', ParseUUIDPipe) idCohorte: string,
    @Query() consulta: AlertasPendientesDtoRequest,
    @Req() request: AuthenticatedSessionRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AlertasPendientesDtoResponse | undefined> {
    const pendientes = await this.listarPendientes.execute(
      contextoAuditoria(request),
      idCohorte.toLowerCase(),
      {
        ...(consulta.tipo_alerta && { tipo_alerta: consulta.tipo_alerta }),
        offset: consulta.offset,
        limit: consulta.limit,
      },
    );
    return responderSinContenido(response, pendientes);
  }

  @Post('alertas/:id_alerta/atender')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @UseGuards(CsrfSessionGuard)
  atender(
    @Param('id_alerta', ParseUUIDPipe) idAlerta: string,
    @Body() dto: MarcarAlertaAtendidaDtoRequest,
    @Req() request: AuthenticatedSessionRequest,
  ): Promise<AlertaAtendidaDtoResponse> {
    return this.marcarAtendida.execute(
      contextoAuditoria(request),
      idAlerta.toLowerCase(),
      dto.motivo,
    );
  }
}
