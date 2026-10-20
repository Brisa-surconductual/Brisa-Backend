import {
  Body,
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
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
import {
  IniciarOReanudarSesionUseCase,
  type InicioSesionConversacionalResponse,
} from '../application/use-cases/iniciar-o-reanudar-sesion.use-case';
import { CuerpoVacioPipe } from './pipes/cuerpo-vacio.pipe';

@Controller('/chat/sesiones')
@AlcancesSesion(AlcanceSesion.COMPLETA)
@Roles(Rol.ESTUDIANTE)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
export class SesionesConversacionalesController {
  constructor(
    private readonly iniciarOReanudar: IniciarOReanudarSesionUseCase,
  ) {}

  @Post('/iniciar')
  @HttpCode(HttpStatus.CREATED)
  @Header('Cache-Control', 'no-store')
  @UseGuards(CsrfSessionGuard)
  async iniciar(
    @Body(CuerpoVacioPipe) _body: unknown,
    @Req() request: AuthenticatedSessionRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ data: InicioSesionConversacionalResponse }> {
    const resultado = await this.iniciarOReanudar.execute(
      request.autenticacion.usuario.id_usuario,
    );

    response.status(resultado.reanudada ? HttpStatus.OK : HttpStatus.CREATED);

    return {
      data: resultado,
    };
  }
}
