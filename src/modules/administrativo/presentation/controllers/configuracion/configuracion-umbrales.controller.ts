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
  TipoUmbralDtoRequest,
} from '../../../application/dto/configuracion/configuracion.dto-request';
import type {
  CambioUmbralDtoResponse,
  UmbralesDtoResponse,
} from '../../../application/dto/configuracion/configuracion.dto-response';
import { MENSAJE_SOLO_GLOBAL_UMBRALES } from '../../../application/exceptions/configuracion.exception';
import { ActualizarUmbralUseCase } from '../../../application/use-cases/configuracion/actualizar-umbral.use-case';
import { ConsultarUmbralesUseCase } from '../../../application/use-cases/configuracion/consultar-umbrales.use-case';
import { SoloConfiguracionGlobal } from '../../decorators/solo-configuracion-global.decorator';
import { contextoAuditoria } from '../../http/contexto-auditoria';

/**
 * RF-136: umbrales de seguimiento de M05 (RF-79) configurables desde M-8. M-8
 * no valida ni persiste: delega en M05 y audita cada cambio efectivo.
 */
@Controller('admin/configuracion/umbrales')
@Roles(Rol.ADMINISTRATIVO, Rol.COORDINADOR_PSI)
@AlcancesSesion(AlcanceSesion.COMPLETA)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
export class ConfiguracionUmbralesController {
  constructor(
    private readonly consultar: ConsultarUmbralesUseCase,
    private readonly actualizar: ActualizarUmbralUseCase,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  listar(): Promise<UmbralesDtoResponse> {
    return this.consultar.execute();
  }

  @Put(':tipo_umbral')
  @Header('Cache-Control', 'no-store')
  @UseGuards(CsrfSessionGuard)
  @SoloConfiguracionGlobal(MENSAJE_SOLO_GLOBAL_UMBRALES)
  cambiar(
    @Param() params: TipoUmbralDtoRequest,
    @Body() body: ActualizarConfiguracionDtoRequest,
    @Req() request: AuthenticatedSessionRequest,
  ): Promise<CambioUmbralDtoResponse> {
    return this.actualizar.execute(
      contextoAuditoria(request),
      params.tipo_umbral,
      body,
    );
  }
}
