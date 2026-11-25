import {
  Controller,
  Get,
  Header,
  Param,
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
import type { ProgresionNarrativaDtoResponse } from '../../../application/dto/seguimiento-individual/progresion-narrativa.dto-response';
import { CodigoParticipanteDtoRequest } from '../../../application/dto/seguimiento-individual/seguimiento-individual.dto-request';
import { ConsultarProgresionNarrativaUseCase } from '../../../application/use-cases/seguimiento-individual/consultar-progresion-narrativa.use-case';
import { AlcancePermiso } from '../../../domain/enums/alcance-permiso.enum';
import { RequierePermisoIndividual } from '../../decorators/requiere-permiso-individual.decorator';
import { contextoAuditoria } from '../../http/contexto-auditoria';
import { responderSinContenido } from '../../http/responder-sin-contenido';

export const CODIGO_SIN_PERMISO_NARRATIVA = 'SIN_PERMISO_NARRATIVA';
export const MENSAJE_SIN_PERMISO_NARRATIVA =
  'Se requiere permiso explícito para consultar la progresión narrativa individual.';

/**
 * RF-130: progresión narrativa individual de un participante, en solo lectura.
 * Al ADMINISTRATIVO le exige un permiso individual vigente con alcance
 * PROGRESION_NARRATIVA (no basta ACCESO_INDIVIDUAL).
 */
@Controller('admin/participantes/:codigo_participante')
@Roles(Rol.ADMINISTRATIVO, Rol.COORDINADOR_PSI)
@AlcancesSesion(AlcanceSesion.COMPLETA)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
export class ProgresionNarrativaController {
  constructor(
    private readonly progresion: ConsultarProgresionNarrativaUseCase,
  ) {}

  @Get('progresion-narrativa')
  @Header('Cache-Control', 'no-store')
  @RequierePermisoIndividual(AlcancePermiso.PROGRESION_NARRATIVA, {
    codigo: CODIGO_SIN_PERMISO_NARRATIVA,
    mensaje: MENSAJE_SIN_PERMISO_NARRATIVA,
  })
  async consultar(
    @Param() params: CodigoParticipanteDtoRequest,
    @Req() request: AuthenticatedSessionRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ProgresionNarrativaDtoResponse | undefined> {
    const progresion = await this.progresion.execute(
      contextoAuditoria(request),
      params.codigo_participante,
    );
    return responderSinContenido(response, progresion);
  }
}
