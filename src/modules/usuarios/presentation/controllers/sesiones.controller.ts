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
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { CookieOptions, Response } from 'express';
import { IniciarSesionUseCase } from '../../application/use-cases/iniciar-sesion.use-case';
import { CerrarSesionUseCase } from '../../application/use-cases/cerrar-sesion.use-case';
import { RegistrarActividadSesionUseCase } from '../../application/use-cases/registrar-actividad-sesion.use-case';
import { RenovarCsrfSesionUseCase } from '../../application/use-cases/renovar-csrf-sesion.use-case';
import { IniciarSesionDtoRequest } from '../../application/dto/iniciar-sesion.dto-request';
import { IniciarSesionDtoResponse } from '../../application/dto/iniciar-sesion.dto-response';
import { CerrarSesionDtoResponse } from '../../application/dto/cerrar-sesion.dto-response';
import { RegistrarActividadSesionDtoRequest } from '../../application/dto/registrar-actividad-sesion.dto-request';
import { RegistrarActividadSesionDtoResponse } from '../../application/dto/registrar-actividad-sesion.dto-response';
import { SesionActualDtoResponse } from '../../application/dto/sesion-actual.dto-response';
import { SessionCookieConfig } from '../../application/ports/session-cookie-config';
import { SessionAuthGuard } from '../guards/session-auth.guard';
import { CsrfSessionGuard } from '../guards/csrf-session.guard';
import { SessionScopeGuard } from '../guards/session-scope.guard';
import { AlcancesSesion } from '../decorators/alcances-sesion.decorator';
import { AlcanceSesion } from '../../domain/enums/alcance-sesion.enum';
import { EstadoRegistro } from '../../domain/enums/estado-registro.enum';
import type { AuthenticatedSessionRequest } from '../http/authenticated-session-request';

@Controller('/usuarios')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class SesionesController {
  constructor(
    private readonly iniciarSesionUseCase: IniciarSesionUseCase,
    private readonly cerrarSesionUseCase: CerrarSesionUseCase,
    private readonly registrarActividadSesionUseCase: RegistrarActividadSesionUseCase,
    private readonly renovarCsrfSesionUseCase: RenovarCsrfSesionUseCase,
    private readonly cookieConfig: SessionCookieConfig,
  ) {}

  @Post('/iniciar-sesion')
  @HttpCode(HttpStatus.OK)
  async iniciarSesion(
    @Body() dto: IniciarSesionDtoRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<IniciarSesionDtoResponse> {
    const resultado = await this.iniciarSesionUseCase.execute(dto);
    response.cookie(
      this.cookieConfig.obtenerNombreCookie(),
      resultado.tokenSesion,
      this.obtenerOpcionesCookie(),
    );
    this.aplicarNoStore(response);

    return resultado.respuesta;
  }

  @Post('/cerrar-sesion')
  @HttpCode(HttpStatus.OK)
  @AlcancesSesion(AlcanceSesion.LIMITADA, AlcanceSesion.COMPLETA)
  @UseGuards(SessionAuthGuard, SessionScopeGuard, CsrfSessionGuard)
  async cerrarSesion(
    @Req() request: AuthenticatedSessionRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<CerrarSesionDtoResponse> {
    const resultado = await this.cerrarSesionUseCase.execute(
      request.autenticacion.sesion.id_sesion,
    );
    response.clearCookie(
      this.cookieConfig.obtenerNombreCookie(),
      this.obtenerOpcionesCookie(),
    );
    this.aplicarNoStore(response);

    return resultado;
  }

  @Post('/sesion/actividad')
  @HttpCode(HttpStatus.OK)
  @AlcancesSesion(AlcanceSesion.LIMITADA, AlcanceSesion.COMPLETA)
  @UseGuards(SessionAuthGuard, SessionScopeGuard, CsrfSessionGuard)
  async registrarActividad(
    @Req() request: AuthenticatedSessionRequest,
    @Body() dto: RegistrarActividadSesionDtoRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<RegistrarActividadSesionDtoResponse> {
    this.aplicarNoStore(response);
    return this.registrarActividadSesionUseCase.execute(
      request.autenticacion.sesion.id_sesion,
      dto,
    );
  }

  @Get('/sesion/actual')
  @AlcancesSesion(AlcanceSesion.LIMITADA, AlcanceSesion.COMPLETA)
  @UseGuards(SessionAuthGuard, SessionScopeGuard)
  async obtenerSesionActual(
    @Req() request: AuthenticatedSessionRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SesionActualDtoResponse> {
    const { sesion, usuario } = request.autenticacion;
    const csrfToken = await this.renovarCsrfSesionUseCase.execute(
      sesion.id_sesion,
    );
    this.aplicarNoStore(response);

    return SesionActualDtoResponse.crear({
      idUsuario: usuario.id_usuario,
      alcance: sesion.alcance_sesion,
      estadoRegistro: this.obtenerNombreEstadoRegistro(usuario.estadoRegistro),
      rol: String(usuario.rol),
      csrfToken,
      limiteInactividadMinutos: sesion.limite_inactividad_minutos,
    });
  }

  private obtenerOpcionesCookie(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.cookieConfig.esSegura(),
      sameSite: this.cookieConfig.obtenerSameSite(),
      path: '/',
    };
  }

  private aplicarNoStore(response: Response): void {
    response.setHeader('Cache-Control', 'no-store, max-age=0');
    response.setHeader('Pragma', 'no-cache');
  }

  private obtenerNombreEstadoRegistro(estado: EstadoRegistro): string {
    return typeof estado === 'string' ? estado : EstadoRegistro[estado];
  }
}
