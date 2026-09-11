import { Controller, Get, Header, Query, UseGuards } from '@nestjs/common';
import { ConsultarUbicacionesTemporalesParticipantesDtoRequest } from '../application/dto/cronograma/consultar-ubicaciones-temporales-participantes.dto-request';
import { UbicacionesTemporalesParticipantesDtoResponse } from '../application/dto/cronograma/ubicaciones-temporales-participantes.dto-response';
import { ConsultarUbicacionesTemporalesParticipantesUseCase } from '../application/use-cases/cronograma/consultar-ubicaciones-temporales-participantes.use-case';
import { AlcanceSesion } from '../../usuarios/domain/enums/alcance-sesion.enum';
import { Rol } from '../../usuarios/domain/enums/rol.enum';
import { AlcancesSesion } from '../../usuarios/presentation/decorators/alcances-sesion.decorator';
import { SessionAuthGuard } from '../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../usuarios/presentation/guards/session-scope.guard';
import { Roles } from '../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../shared/presentation/guards/role-guard';

@Controller('/cronograma/participantes')
export class UbicacionesTemporalesParticipantesController {
  constructor(
    private readonly consultarUbicaciones: ConsultarUbicacionesTemporalesParticipantesUseCase,
  ) {}

  @Get('/ubicaciones-temporales')
  @Header('Cache-Control', 'no-store')
  @AlcancesSesion(AlcanceSesion.COMPLETA)
  @Roles(Rol.ADMINISTRATIVO)
  @UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
  async consultar(
    @Query() dto: ConsultarUbicacionesTemporalesParticipantesDtoRequest,
  ): Promise<UbicacionesTemporalesParticipantesDtoResponse> {
    return this.consultarUbicaciones.execute(dto);
  }
}
