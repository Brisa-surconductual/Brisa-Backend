import {
  Controller,
  Get,
  Header,
  HttpStatus,
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
import {
  CodigoParticipanteDtoRequest,
  HistorialAlertasDtoRequest,
} from '../../../application/dto/seguimiento-individual/seguimiento-individual.dto-request';
import type {
  HistorialAlertasDtoResponse,
  PerfilSeguimientoDtoResponse,
} from '../../../application/dto/seguimiento-individual/seguimiento-individual.dto-response';
import { ConsultarHistorialAlertasUseCase } from '../../../application/use-cases/seguimiento-individual/consultar-historial-alertas.use-case';
import { ConsultarPerfilSeguimientoUseCase } from '../../../application/use-cases/seguimiento-individual/consultar-perfil-seguimiento.use-case';
import { AlcancePermiso } from '../../../domain/enums/alcance-permiso.enum';
import { RequierePermisoIndividual } from '../../decorators/requiere-permiso-individual.decorator';
import { contextoAuditoria } from '../../http/contexto-auditoria';

export const MENSAJE_SIN_PERMISO_SEGUIMIENTO =
  'No tiene permisos para consultar perfiles de seguimiento individuales.';

/**
 * RF-128 / RF-129: seguimiento individual de un participante en solo lectura.
 * Exige un permiso individual vigente (RF-04) al ADMINISTRATIVO.
 */
@Controller('admin/participantes/:codigo_participante')
@Roles(Rol.ADMINISTRATIVO, Rol.COORDINADOR_PSI)
@AlcancesSesion(AlcanceSesion.COMPLETA)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
export class SeguimientoIndividualController {
  constructor(
    private readonly perfil: ConsultarPerfilSeguimientoUseCase,
    private readonly alertas: ConsultarHistorialAlertasUseCase,
  ) {}

  @Get('perfil-seguimiento')
  @Header('Cache-Control', 'no-store')
  @RequierePermisoIndividual(AlcancePermiso.ACCESO_INDIVIDUAL, {
    mensaje: MENSAJE_SIN_PERMISO_SEGUIMIENTO,
  })
  async consultarPerfil(
    @Param() params: CodigoParticipanteDtoRequest,
    @Req() request: AuthenticatedSessionRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<PerfilSeguimientoDtoResponse | undefined> {
    const perfil = await this.perfil.execute(
      contextoAuditoria(request),
      params.codigo_participante,
    );
    return this.responder(response, perfil);
  }

  @Get('alertas')
  @Header('Cache-Control', 'no-store')
  @RequierePermisoIndividual(AlcancePermiso.ACCESO_INDIVIDUAL, {
    mensaje: MENSAJE_SIN_PERMISO_SEGUIMIENTO,
  })
  async consultarAlertas(
    @Param() params: CodigoParticipanteDtoRequest,
    @Query() consulta: HistorialAlertasDtoRequest,
    @Req() request: AuthenticatedSessionRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<HistorialAlertasDtoResponse | undefined> {
    const historial = await this.alertas.execute(
      contextoAuditoria(request),
      params.codigo_participante,
      { offset: consulta.offset, limit: consulta.limit },
    );
    return this.responder(response, historial);
  }

  /** Sin datos de M05: 204 sin cuerpo. */
  private responder<T>(response: Response, datos: T | null): T | undefined {
    if (datos === null) {
      response.status(HttpStatus.NO_CONTENT);
      return undefined;
    }
    return datos;
  }
}
