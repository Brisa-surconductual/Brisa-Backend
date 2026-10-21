import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { ConsultarEstadisticasProgramaUseCase } from '../../application/use-cases/consultar-estadisticas-programa.use-case';
import { EstadisticasProgramaDtoResponse } from '../../application/dto/estadisticas-programa.dto-response';
import { AlcanceSesion } from '../../domain/enums/alcance-sesion.enum';
import { Rol } from '../../domain/enums/rol.enum';
import { AlcancesSesion } from '../decorators/alcances-sesion.decorator';
import { SessionAuthGuard } from '../guards/session-auth.guard';
import { SessionScopeGuard } from '../guards/session-scope.guard';
import { Roles } from '../../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../../shared/presentation/guards/role-guard';

@Controller('/usuarios/estadisticas-programa')
export class EstadisticasProgramaController {
  constructor(
    private readonly consultar: ConsultarEstadisticasProgramaUseCase,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @AlcancesSesion(AlcanceSesion.COMPLETA)
  @Roles(Rol.ADMINISTRATIVO)
  @UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
  async obtener(): Promise<EstadisticasProgramaDtoResponse> {
    return this.consultar.execute();
  }
}
