import {
  BadRequestException,
  Controller,
  Get,
  Header,
  HttpStatus,
  Query,
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
import { SessionAuthGuard } from '../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../usuarios/presentation/guards/session-scope.guard';
import type { AuthenticatedSessionRequest } from '../../usuarios/presentation/http/authenticated-session-request';
import { ContenidoVigenteChatDtoResponse } from '../application/dto/contenido-vigente-chat.dto-response';
import { ConsultarMiContenidoVigenteUseCase } from '../application/use-cases/consultar-mi-contenido-vigente.use-case';

@Controller('/chat/me')
@AlcancesSesion(AlcanceSesion.COMPLETA)
@Roles(Rol.ESTUDIANTE)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
export class ContenidoVigenteChatController {
  constructor(
    private readonly consultarContenido: ConsultarMiContenidoVigenteUseCase,
  ) {}

  @Get('/contenidos-vigentes')
  @Header('Cache-Control', 'no-store')
  async consultar(
    @Req() request: AuthenticatedSessionRequest,
    @Query() consulta: Record<string, unknown>,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ContenidoVigenteChatDtoResponse[] | undefined> {
    if (Object.keys(consulta).length > 0) {
      throw new BadRequestException(
        'Esta consulta no admite parámetros; utiliza el usuario de la sesión y la fecha actual del servidor.',
      );
    }

    const contenidos = await this.consultarContenido.execute(
      request.autenticacion.usuario.id_usuario,
    );
    if (contenidos.length === 0) {
      response.status(HttpStatus.NO_CONTENT);
      return undefined;
    }

    return contenidos;
  }
}
