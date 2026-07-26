import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ActualizarRevisionRegistroUseCase } from '../../application/use-cases/actualizar-revision-registro.use-case';
import { CancelarRegistroProvisionalUseCase } from '../../application/use-cases/cancelar-registro-provisional.use-case';
import { CompletarConsentimientoLineaBaseUseCase } from '../../application/use-cases/completar-consentimiento-linea-base.use-case';
import { ConfirmarRegistroUseCase } from '../../application/use-cases/confirmar-registro.use-case';
import { ConsultarConsentimientoVigenteUseCase } from '../../application/use-cases/consultar-consentimiento-vigente.use-case';
import { ConsultarRevisionRegistroUseCase } from '../../application/use-cases/consultar-revision-registro.use-case';
import { ReaceptarConsentimientoUseCase } from '../../application/use-cases/reaceptar-consentimiento.use-case';
import { Permiso } from '../../domain/enums/permiso.enum';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import {
  getAuthCookieName,
  getAuthCookieOptions,
  getCsrfCookieName,
  getCsrfCookieOptions,
} from '../auth/auth-cookie';
import { JwtSessionGuard } from '../auth/jwt-session.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { ActualizarRevisionDto } from '../dto/actualizar-revision.dto';
import { CompletarConsentimientoLineaBaseDto } from '../dto/completar-consentimiento-linea-base.dto';
import { ReaceptarConsentimientoDto } from '../dto/reaceptar-consentimiento.dto';

@Controller('usuarios/registro')
@UseGuards(JwtSessionGuard, PermissionsGuard)
@Permissions(Permiso.COMPLETAR_REGISTRO)
export class RegistroController {
  constructor(
    private readonly consultarConsentimiento: ConsultarConsentimientoVigenteUseCase,
    private readonly completarConsentimientoLineaBase: CompletarConsentimientoLineaBaseUseCase,
    private readonly consultarRevision: ConsultarRevisionRegistroUseCase,
    private readonly actualizarRevision: ActualizarRevisionRegistroUseCase,
    private readonly reaceptarConsentimiento: ReaceptarConsentimientoUseCase,
    private readonly confirmarRegistro: ConfirmarRegistroUseCase,
    private readonly cancelarRegistro: CancelarRegistroProvisionalUseCase,
  ) {}

  @Get('consentimiento-vigente')
  consentimientoVigente() {
    return this.consultarConsentimiento.execute();
  }

  @Post('consentimiento-linea-base')
  async completar(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CompletarConsentimientoLineaBaseDto,
  ) {
    return this.completarConsentimientoLineaBase.execute(request.user.sub, {
      idConsentimiento: dto.idConsentimiento,
      consentimientoAceptado: dto.consentimientoAceptado,
      registroConsumoAutorizado: dto.registroConsumoAutorizado,
      lineaBase: {
        ...dto.lineaBase,
        fechaInicioConsumo: new Date(dto.lineaBase.fechaInicioConsumo),
        fechaUltimoConsumo: new Date(dto.lineaBase.fechaUltimoConsumo),
      },
    });
  }

  @Get('revision')
  revision(@Req() request: AuthenticatedRequest) {
    return this.consultarRevision.execute(request.user.sub);
  }

  @Patch('revision')
  actualizar(
    @Req() request: AuthenticatedRequest,
    @Body() dto: ActualizarRevisionDto,
  ) {
    const { fechaInicioConsumo, fechaUltimoConsumo, ...otrosCampos } = dto;

    return this.actualizarRevision.execute(request.user.sub, {
      ...otrosCampos,
      ...(fechaInicioConsumo
        ? { fechaInicioConsumo: new Date(fechaInicioConsumo) }
        : {}),
      ...(fechaUltimoConsumo
        ? { fechaUltimoConsumo: new Date(fechaUltimoConsumo) }
        : {}),
    });
  }

  @Post('reaceptar-consentimiento')
  @HttpCode(HttpStatus.OK)
  reaceptar(
    @Req() request: AuthenticatedRequest,
    @Body() dto: ReaceptarConsentimientoDto,
  ) {
    return this.reaceptarConsentimiento.execute(request.user.sub, dto);
  }

  @Post('confirmar')
  @HttpCode(HttpStatus.OK)
  confirmar(@Req() request: AuthenticatedRequest) {
    return this.confirmarRegistro.execute(request.user.sub);
  }

  @Delete('cancelar')
  async cancelar(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.cancelarRegistro.execute(request.user.sub);
    response.clearCookie(getAuthCookieName(), getAuthCookieOptions());
    response.clearCookie(getCsrfCookieName(), getCsrfCookieOptions());
    return result;
  }
}
