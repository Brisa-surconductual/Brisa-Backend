import { Controller, Get, Header, Param, ParseUUIDPipe, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ConsultarInformacionTemporalDtoRequest } from '../application/dto/informacionTemporal/consultar-informacion-temporal.dto-request';
import { InformacionTemporalUsuarioDtoResponse } from '../application/dto/informacionTemporal/informacion-temporal-usuario.dto-response';
import { ConsultarInformacionTemporalUsuarioUseCase } from '../application/use-cases/cronograma/consultar-informacion-temporal-usuario.use-case';
import { AlcanceSesion } from '../../usuarios/domain/enums/alcance-sesion.enum';
import { Rol } from '../../usuarios/domain/enums/rol.enum';
import { AlcancesSesion } from '../../usuarios/presentation/decorators/alcances-sesion.decorator';
import { Roles } from '../../../shared/presentation/decorators/roles.decorator';
import { SessionAuthGuard } from '../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../usuarios/presentation/guards/session-scope.guard';
import { RolesGuard } from '../../../shared/presentation/guards/role-guard';
import { CsrfSessionGuard } from '../../usuarios/presentation/guards/csrf-session.guard';

@Controller('/cronograma/participantes')
export class InformacionTemporalController {
  constructor(
    private readonly consultarInformacionTemporalUseCase: ConsultarInformacionTemporalUsuarioUseCase,
  ) {}

  @Get('/:id_usuario/informacion-temporal')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @AlcancesSesion(AlcanceSesion.COMPLETA)
  @Roles(Rol.ADMINISTRATIVO)
  @UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard, CsrfSessionGuard)
  async consultar(
    @Param('id_usuario', new ParseUUIDPipe()) idUsuario: string,
    @Query() dto: ConsultarInformacionTemporalDtoRequest,
  ): Promise<InformacionTemporalUsuarioDtoResponse> {
    return this.consultarInformacionTemporalUseCase.execute(
      idUsuario,
      dto.fecha_consulta,
    );
  }
}