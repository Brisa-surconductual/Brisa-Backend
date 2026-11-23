import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../../shared/presentation/guards/role-guard';
import { AlcanceSesion } from '../../../usuarios/domain/enums/alcance-sesion.enum';
import { Rol } from '../../../usuarios/domain/enums/rol.enum';
import { AlcancesSesion } from '../../../usuarios/presentation/decorators/alcances-sesion.decorator';
import { CsrfSessionGuard } from '../../../usuarios/presentation/guards/csrf-session.guard';
import { SessionAuthGuard } from '../../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../../usuarios/presentation/guards/session-scope.guard';
import type { AuthenticatedSessionRequest } from '../../../usuarios/presentation/http/authenticated-session-request';
import { GestionarCohortesUseCase } from '../../application/use-cases/gestionar-cohortes.use-case';
import { ConsultarCohortesUseCase } from '../../application/use-cases/consultar-cohortes.use-case';
import { ActualizarCohorteDto, CrearCohorteDto } from '../dto/cohorte.dto';
import { contextoAuditoria } from '../http/contexto-auditoria';

@Controller('admin/cohortes')
@Roles(Rol.ADMINISTRATIVO)
@AlcancesSesion(AlcanceSesion.COMPLETA)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
export class CohortesController {
  constructor(
    private readonly gestionar: GestionarCohortesUseCase,
    private readonly consultar: ConsultarCohortesUseCase,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  listar(@Req() request: AuthenticatedSessionRequest) {
    return this.consultar.listar(contextoAuditoria(request));
  }

  @Get(':id_cohorte')
  @Header('Cache-Control', 'no-store')
  obtener(
    @Param('id_cohorte', new ParseUUIDPipe()) id: string,
    @Req() request: AuthenticatedSessionRequest,
  ) {
    return this.consultar.obtener(contextoAuditoria(request), id);
  }

  @Post()
  @UseGuards(CsrfSessionGuard)
  @Header('Cache-Control', 'no-store')
  crear(
    @Body() dto: CrearCohorteDto,
    @Req() request: AuthenticatedSessionRequest,
  ) {
    return this.gestionar.crear(this.actor(request), dto);
  }

  @Patch(':id_cohorte')
  @UseGuards(CsrfSessionGuard)
  @Header('Cache-Control', 'no-store')
  actualizar(
    @Param('id_cohorte', new ParseUUIDPipe()) id: string,
    @Body() dto: ActualizarCohorteDto,
    @Req() request: AuthenticatedSessionRequest,
  ) {
    return this.gestionar.actualizar(this.actor(request), id, dto);
  }

  private actor(request: AuthenticatedSessionRequest) {
    return {
      ...contextoAuditoria(request),
      idUsuario: request.autenticacion.usuario.id_usuario,
    };
  }
}
