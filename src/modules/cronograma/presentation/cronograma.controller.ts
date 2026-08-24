import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { CreacionUnidadTemporalUseCase } from "../application/use-cases/crear-unidad-temporal.use-case";
import { UnidadTemporalDtoRequest } from "../application/dto/crear-unidad-temporal.dto-request";
import { UnidadTemporalDtoResponse } from "../application/dto/crear-unidad-temporal.dto-response";
import { SessionAuthGuard } from '../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../usuarios/presentation/guards/session-scope.guard';
import { RolesGuard } from '../../../shared/presentation/guards/role-guard';
import { AlcancesSesion } from '../../usuarios/presentation/decorators/alcances-sesion.decorator';
import { Roles } from '../../../shared/presentation/decorators/roles.decorator';
import { AlcanceSesion } from '../../usuarios/domain/enums/alcance-sesion.enum';

@Controller('/cronograma')
export class CronogramaController {
  constructor(
    private readonly creacionUnidadTemporalUseCase: CreacionUnidadTemporalUseCase,
  ) {}

  @Post('/crear/unidad-temporal')
  @AlcancesSesion(AlcanceSesion.COMPLETA)
  @Roles('ADMINISTRATIVO')
  @UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
  async crearUnidadTemporal(
    @Body() dto: UnidadTemporalDtoRequest,
  ): Promise<UnidadTemporalDtoResponse> {
    return this.creacionUnidadTemporalUseCase.execute(dto);
  }
  
}