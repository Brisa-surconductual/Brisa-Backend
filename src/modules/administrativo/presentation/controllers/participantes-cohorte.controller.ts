import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
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
import { GestionarParticipantesCohorteUseCase } from '../../application/use-cases/gestionar-participantes-cohorte.use-case';
import {
  AsignarParticipantesCohorteDto,
  RetirarParticipanteCohorteParams,
} from '../dto/participantes-cohorte.dto';
import { contextoAuditoria } from '../http/contexto-auditoria';

@Controller('admin/cohortes/:id_cohorte/participantes')
@Roles(Rol.ADMINISTRATIVO, Rol.COORDINADOR_PSI)
@AlcancesSesion(AlcanceSesion.COMPLETA)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
export class ParticipantesCohorteController {
  constructor(
    private readonly participantes: GestionarParticipantesCohorteUseCase,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  listar(
    @Param('id_cohorte', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedSessionRequest,
  ) {
    return this.participantes.listar(contextoAuditoria(request), id);
  }

  @Get('elegibles')
  @Header('Cache-Control', 'no-store')
  listarElegibles(
    @Param('id_cohorte', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedSessionRequest,
  ) {
    return this.participantes.listarElegibles(contextoAuditoria(request), id);
  }

  @Post()
  @UseGuards(CsrfSessionGuard)
  @Header('Cache-Control', 'no-store')
  asignar(
    @Param('id_cohorte', ParseUUIDPipe) id: string,
    @Body() dto: AsignarParticipantesCohorteDto,
    @Req() request: AuthenticatedSessionRequest,
  ) {
    return this.participantes.asignar(
      contextoAuditoria(request),
      id,
      dto.codigos_participante,
    );
  }

  @Delete(':codigo_participante')
  @UseGuards(CsrfSessionGuard)
  @Header('Cache-Control', 'no-store')
  retirar(
    @Param() params: RetirarParticipanteCohorteParams,
    @Req() request: AuthenticatedSessionRequest,
  ) {
    return this.participantes.retirar(
      contextoAuditoria(request),
      params.id_cohorte,
      params.codigo_participante,
    );
  }
}
