import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ActivarCronogramaDtoRequest } from '../application/dto/cronograma/activar-cronograma.dto-request';
import type { Response } from 'express';
import { Roles } from '../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../shared/presentation/guards/role-guard';
import { AlcanceSesion } from '../../usuarios/domain/enums/alcance-sesion.enum';
import { Rol } from '../../usuarios/domain/enums/rol.enum';
import { AlcancesSesion } from '../../usuarios/presentation/decorators/alcances-sesion.decorator';
import { CsrfSessionGuard } from '../../usuarios/presentation/guards/csrf-session.guard';
import { SessionAuthGuard } from '../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../usuarios/presentation/guards/session-scope.guard';
import type { AuthenticatedSessionRequest } from '../../usuarios/presentation/http/authenticated-session-request';
import { ActivarCronogramaUseCase } from '../application/use-cases/cronograma/activar-cronograma.use-case';
import { ConsultarMiCronogramaUseCase } from '../application/use-cases/cronograma/consultar-mi-cronograma.use-case';
import { ConsultarContenidoVigenteUsuarioUseCase } from '../application/use-cases/contenido/consultar-contenido-vigente-usuario.use-case';

@Controller('/cronograma')
@AlcancesSesion(AlcanceSesion.COMPLETA)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
export class GestionBaseCronogramaController {
  constructor(
    private readonly activar: ActivarCronogramaUseCase,
    private readonly consultar: ConsultarMiCronogramaUseCase,
    private readonly contenidos: ConsultarContenidoVigenteUsuarioUseCase,
  ) {}

  @Post('/:id_cronograma/activar')
  @HttpCode(200)
  @Roles(Rol.ADMINISTRATIVO)
  @UseGuards(CsrfSessionGuard)
  async activarCronograma(
    @Param('id_cronograma', new ParseUUIDPipe()) id: string,
    @Body() dto: ActivarCronogramaDtoRequest,
  ) {
    if (dto.confirmacion_activacion !== true)
      throw new BadRequestException('Debes confirmar la activación.');
    return this.activar.execute(id);
  }

  @Get('/me')
  @Header('Cache-Control', 'no-store')
  @Roles(Rol.ESTUDIANTE)
  consultarMiCronograma(@Req() request: AuthenticatedSessionRequest) {
    return this.consultar.execute(request.autenticacion.usuario.id_usuario);
  }

  @Get('/me/contenidos-vigentes')
  @Header('Cache-Control', 'no-store')
  @Roles(Rol.ESTUDIANTE)
  async consultarMisContenidos(
    @Req() request: AuthenticatedSessionRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const contenidos = await this.contenidos.execute(
      request.autenticacion.usuario.id_usuario,
    );
    if (contenidos.length === 0) {
      response.status(204);
      return;
    }
    return contenidos;
  }
}
