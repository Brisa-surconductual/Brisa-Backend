import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../../../shared/presentation/guards/role-guard';
import { AlcanceSesion } from '../../../../usuarios/domain/enums/alcance-sesion.enum';
import { Rol } from '../../../../usuarios/domain/enums/rol.enum';
import { AlcancesSesion } from '../../../../usuarios/presentation/decorators/alcances-sesion.decorator';
import { CsrfSessionGuard } from '../../../../usuarios/presentation/guards/csrf-session.guard';
import { SessionAuthGuard } from '../../../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../../../usuarios/presentation/guards/session-scope.guard';
import type { AuthenticatedSessionRequest } from '../../../../usuarios/presentation/http/authenticated-session-request';
import {
  ActualizarConfiguracionDtoRequest,
  TipoParametroDtoRequest,
} from '../../../application/dto/configuracion/configuracion.dto-request';
import type {
  CambioParametroNotificacionDtoResponse,
  ParametrosNotificacionDtoResponse,
} from '../../../application/dto/configuracion/configuracion.dto-response';
import { MENSAJE_SOLO_GLOBAL_NOTIFICACIONES } from '../../../application/exceptions/configuracion.exception';
import { ActualizarParametroNotificacionUseCase } from '../../../application/use-cases/configuracion/actualizar-parametro-notificacion.use-case';
import { ConsultarParametrosNotificacionUseCase } from '../../../application/use-cases/configuracion/consultar-parametros-notificacion.use-case';
import { SoloConfiguracionGlobal } from '../../decorators/solo-configuracion-global.decorator';
import { contextoAuditoria } from '../../http/contexto-auditoria';

/**
 * RF-137: parámetros globales de M07 (RF-87, RF-88, RF-89) configurables desde
 * una única vista de M-8. M-8 no valida ni persiste: delega en M07 y audita
 * cada cambio efectivo. No admite valores por usuario.
 */
@Controller('admin/configuracion/notificaciones')
@Roles(Rol.ADMINISTRATIVO, Rol.COORDINADOR_PSI)
@AlcancesSesion(AlcanceSesion.COMPLETA)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
export class ConfiguracionNotificacionesController {
  constructor(
    private readonly consultar: ConsultarParametrosNotificacionUseCase,
    private readonly actualizar: ActualizarParametroNotificacionUseCase,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  listar(): Promise<ParametrosNotificacionDtoResponse> {
    return this.consultar.execute();
  }

  @Put(':tipo_parametro')
  @Header('Cache-Control', 'no-store')
  @UseGuards(CsrfSessionGuard)
  @SoloConfiguracionGlobal(MENSAJE_SOLO_GLOBAL_NOTIFICACIONES)
  cambiar(
    @Param() params: TipoParametroDtoRequest,
    @Body() body: ActualizarConfiguracionDtoRequest,
    @Req() request: AuthenticatedSessionRequest,
  ): Promise<CambioParametroNotificacionDtoResponse> {
    return this.actualizar.execute(
      contextoAuditoria(request),
      params.tipo_parametro,
      body,
    );
  }
}
