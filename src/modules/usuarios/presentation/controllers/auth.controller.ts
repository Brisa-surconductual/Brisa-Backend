import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { randomBytes } from 'node:crypto';
import { ActualizarEstadoSesionUseCase } from '../../application/use-cases/actualizar-estado-sesion.use-case';
import { CerrarSesionUseCase } from '../../application/use-cases/cerrar-sesion.use-case';
import { ConsultarSesionActualUseCase } from '../../application/use-cases/consultar-sesion-actual.use-case';
import { IniciarSesionUseCase } from '../../application/use-cases/iniciar-sesion.use-case';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import {
  getAuthCookieName,
  getAuthCookieOptions,
  getCsrfCookieName,
  getCsrfCookieOptions,
} from '../auth/auth-cookie';
import { JwtSessionGuard } from '../auth/jwt-session.guard';
import { EstadoAplicacionDto } from '../dto/estado-aplicacion.dto';
import { IniciarSesionDto } from '../dto/iniciar-sesion.dto';

@Controller('usuarios/auth')
export class AuthController {
  constructor(
    private readonly iniciarSesion: IniciarSesionUseCase,
    private readonly cerrarSesion: CerrarSesionUseCase,
    private readonly actualizarEstadoSesion: ActualizarEstadoSesionUseCase,
    private readonly consultarSesionActual: ConsultarSesionActualUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginPwa(
    @Body() dto: IniciarSesionDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const resultado = await this.iniciarSesion.execute(dto);
    response.cookie(
      getAuthCookieName(),
      resultado.accessToken,
      getAuthCookieOptions(resultado.expiresInSeconds * 1_000),
    );
    const csrfToken = randomBytes(32).toString('base64url');
    response.cookie(
      getCsrfCookieName(),
      csrfToken,
      getCsrfCookieOptions(resultado.expiresInSeconds * 1_000),
    );
    response.setHeader('Cache-Control', 'no-store');

    return {
      expiresInSeconds: resultado.expiresInSeconds,
      idSesion: resultado.idSesion,
      usuario: resultado.usuario,
      csrfToken,
    };
  }

  @Post('token')
  @HttpCode(HttpStatus.OK)
  async loginNativo(
    @Body() dto: IniciarSesionDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader('Cache-Control', 'no-store');
    return this.iniciarSesion.execute(dto);
  }

  @Get('me')
  @UseGuards(JwtSessionGuard)
  me(@Req() request: AuthenticatedRequest) {
    return this.consultarSesionActual.execute(request.user.sub);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtSessionGuard)
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.cerrarSesion.execute(request.user.sid);
    response.clearCookie(getAuthCookieName(), getAuthCookieOptions());
    response.clearCookie(getCsrfCookieName(), getCsrfCookieOptions());
    response.setHeader('Cache-Control', 'no-store');
    return result;
  }

  @Post('session/state')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtSessionGuard)
  actualizarEstado(
    @Req() request: AuthenticatedRequest,
    @Body() dto: EstadoAplicacionDto,
  ) {
    return this.actualizarEstadoSesion.execute(request.user.sid, dto.estado);
  }
}
