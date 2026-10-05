import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from "express";
import { CreacionUsuarioUseCase } from "../../application/use-cases/creacion-usuario.use-case";
import { CreacionUsuarioDtoRequest } from "../../application/dto/creacion-usuario.dto-request";
import { CreacionUsuarioDtoResponse } from "../../application/dto/creacion-usuario.dto-response";
import { SolicitarRecuperacionDtoRequest } from "../../application/dto/solicitar-recuperacion.dto-request";
import { SolicitarRecuperacionDtoResponse } from "../../application/dto/solicitar-recuperacion.dto-response";
import { RecuperacionUseCase } from "../../application/use-cases/recuperacion-contrasena.use-case";
import { ActualizarContrasenaUseCase } from "../../application/use-cases/actualizar-contraseña.use-case";
import { ActualizacionContrasenaDtoRequest } from "../../application/dto/actualizacion-contrasena.dto-request";
import { ActualizacionContrasenaDtoResponse } from "../../application/dto/actualizacion-contrasena.dto-response";
import { CreacionUsuarioAdminDtoResponse } from "../../application/dto/crear-administrativo.dto-response";
import { CreacionUsuarioAdminDtoRequest } from "../../application/dto/crear-administrativo.dto-request";
import { CreacionAdministradorUseCase } from "../../application/use-cases/creacion-adimistrador.use-case";
import { SessionCookieConfig } from '../../application/ports/session-cookie-config';
import { AlcanceSesion } from '../../domain/enums/alcance-sesion.enum';
import { Rol } from '../../domain/enums/rol.enum';
import { AlcancesSesion } from '../decorators/alcances-sesion.decorator';
import { CsrfSessionGuard } from '../guards/csrf-session.guard';
import { SessionAuthGuard } from '../guards/session-auth.guard';
import { SessionScopeGuard } from '../guards/session-scope.guard';
import { Roles } from '../../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../../shared/presentation/guards/role-guard';
import { BuscarUsuariosUseCase } from '../../application/use-cases/buscar-usuario.use-case';
import {BuscarUsuariosQueryDto} from "../../application/dto/utils/buscador-usuario.dto-request";

@Controller('/usuarios')
export class UsuariosController {
  constructor(
    private readonly actualizarContrasenaUse: ActualizarContrasenaUseCase,
    private readonly recuperacion: RecuperacionUseCase,
    private readonly crearUsuario: CreacionUsuarioUseCase,
    private readonly crearAdministrador: CreacionAdministradorUseCase,
    private readonly cookieConfig: SessionCookieConfig,
    private readonly buscarUsuarios: BuscarUsuariosUseCase,
  ) {}

  @Get('/buscar')
  @HttpCode(HttpStatus.OK)
  @AlcancesSesion(AlcanceSesion.COMPLETA)
  @Roles(Rol.ADMINISTRATIVO)
  @UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard, CsrfSessionGuard)
  async buscar(@Query() dto: BuscarUsuariosQueryDto) {
    return this.buscarUsuarios.execute(dto.q);
  }

  @Post('/crear/estudiante')
  @HttpCode(HttpStatus.CREATED)
  async crear(
    @Body() dto: CreacionUsuarioDtoRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<CreacionUsuarioDtoResponse> {
    const resultado = await this.crearUsuario.execute(dto);

    response.cookie(
      this.cookieConfig.obtenerNombreCookie(),
      resultado.tokenSesion,
      this.cookieConfig.obtenerOpcionesCookie(),
    );

    return resultado.respuesta;
  }

  @Post('/crear/administrativo')
  @HttpCode(HttpStatus.CREATED)
  @AlcancesSesion(AlcanceSesion.COMPLETA)
  @Roles(Rol.ADMINISTRATIVO)
  @UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard, CsrfSessionGuard)
  async crearAdministrativo(
    @Body() dto: CreacionUsuarioAdminDtoRequest,
  ): Promise<CreacionUsuarioAdminDtoResponse> {
    return this.crearAdministrador.execute(dto);
  }

  @Post('/envio-codigo-recuperacion')
  @HttpCode(HttpStatus.CREATED)
  async solicitarRecuperacion(
    @Body() dto: SolicitarRecuperacionDtoRequest,
    @Req() req: Request,
  ): Promise<SolicitarRecuperacionDtoResponse> {
    const direccionIp = req.ip ?? '';
    return this.recuperacion.execute(dto, direccionIp);
  }

  @Post('/actualizar-contrasena')
  @HttpCode(HttpStatus.OK)
  async actualizarContrasena(
    @Body() dto: ActualizacionContrasenaDtoRequest,
  ): Promise<ActualizacionContrasenaDtoResponse> {
    return this.actualizarContrasenaUse.execute(dto);
  }
}
