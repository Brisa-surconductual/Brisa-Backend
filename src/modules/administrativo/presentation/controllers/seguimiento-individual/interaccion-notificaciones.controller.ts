import {
  Controller,
  Get,
  Header,
  Param,
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
import { SessionAuthGuard } from '../../../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../../../usuarios/presentation/guards/session-scope.guard';
import type { AuthenticatedSessionRequest } from '../../../../usuarios/presentation/http/authenticated-session-request';
import { InteraccionNotificacionesDtoRequest } from '../../../application/dto/seguimiento-individual/interaccion-notificaciones.dto-request';
import type { InteraccionNotificacionesDtoResponse } from '../../../application/dto/seguimiento-individual/interaccion-notificaciones.dto-response';
import { CodigoParticipanteDtoRequest } from '../../../application/dto/seguimiento-individual/seguimiento-individual.dto-request';
import { ConsultarInteraccionNotificacionesUseCase } from '../../../application/use-cases/seguimiento-individual/consultar-interaccion-notificaciones.use-case';
import { AlcancePermiso } from '../../../domain/enums/alcance-permiso.enum';
import { RequierePermisoIndividual } from '../../decorators/requiere-permiso-individual.decorator';
import { contextoAuditoria } from '../../http/contexto-auditoria';
import { responderSinContenido } from '../../http/responder-sin-contenido';

export const MENSAJE_SIN_PERMISO_NOTIFICACIONES =
  'No tiene permisos para consultar el historial de interacción con notificaciones del participante.';

/**
 * RF-131: interacción de un participante con las notificaciones, en solo
 * lectura. Al ADMINISTRATIVO le exige un permiso individual vigente con
 * alcance ACCESO_INDIVIDUAL.
 */
@Controller('admin/participantes/:codigo_participante')
@Roles(Rol.ADMINISTRATIVO, Rol.COORDINADOR_PSI)
@AlcancesSesion(AlcanceSesion.COMPLETA)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
export class InteraccionNotificacionesController {
  constructor(
    private readonly interaccion: ConsultarInteraccionNotificacionesUseCase,
  ) {}

  @Get('interaccion-notificaciones')
  @Header('Cache-Control', 'no-store')
  @RequierePermisoIndividual(AlcancePermiso.ACCESO_INDIVIDUAL, {
    mensaje: MENSAJE_SIN_PERMISO_NOTIFICACIONES,
  })
  async consultar(
    @Param() params: CodigoParticipanteDtoRequest,
    @Query() consulta: InteraccionNotificacionesDtoRequest,
    @Req() request: AuthenticatedSessionRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<InteraccionNotificacionesDtoResponse | undefined> {
    const interaccion = await this.interaccion.execute(
      contextoAuditoria(request),
      params.codigo_participante,
      {
        fecha_inicio: consulta.fecha_inicio ?? null,
        fecha_fin: consulta.fecha_fin ?? null,
      },
    );
    return responderSinContenido(response, interaccion);
  }
}
