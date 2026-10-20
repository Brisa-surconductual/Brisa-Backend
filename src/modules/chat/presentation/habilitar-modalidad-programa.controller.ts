import {
  Body,
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../shared/presentation/guards/role-guard';
import { AlcanceSesion } from '../../usuarios/domain/enums/alcance-sesion.enum';
import { Rol } from '../../usuarios/domain/enums/rol.enum';
import { AlcancesSesion } from '../../usuarios/presentation/decorators/alcances-sesion.decorator';
import { CsrfSessionGuard } from '../../usuarios/presentation/guards/csrf-session.guard';
import { SessionAuthGuard } from '../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../usuarios/presentation/guards/session-scope.guard';
import type { AuthenticatedSessionRequest } from '../../usuarios/presentation/http/authenticated-session-request';
import { HabilitarModalidadPersonalizadaUseCase } from '../application/use-cases/habilitar-modalidad-personalizada.use-case';

interface HabilitarModalidadDtoResponse {
  readonly id_programa: number;
  readonly modalidad: string;
  readonly usuarios_actualizados: number;
  readonly fecha_vigencia_desde: string;
  readonly administrador_responsable: string;
}

@Controller('/chat/admin/modalidad')
@AlcancesSesion(AlcanceSesion.COMPLETA)
@Roles(Rol.ADMINISTRATIVO)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
export class HabilitarModalidadProgramaController {
  constructor(
    private readonly habilitarModalidad: HabilitarModalidadPersonalizadaUseCase,
  ) {}

  @Post('/habilitar-personalizada')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @UseGuards(CsrfSessionGuard)
  async habilitar(
    @Body('id_programa', new ParseIntPipe()) idPrograma: number,
    @Body('confirmacion_transicion') confirmacion: unknown,
    @Req() request: AuthenticatedSessionRequest,
  ): Promise<HabilitarModalidadDtoResponse> {
    const resultado = await this.habilitarModalidad.execute({
      idPrograma,
      idAdministrador: request.autenticacion.usuario.id_usuario,
      confirmacionTransicion: confirmacion === true,
    });

    return {
      id_programa: resultado.idPrograma,
      modalidad: resultado.modalidad,
      usuarios_actualizados: resultado.usuariosActualizados,
      fecha_vigencia_desde: resultado.fechaVigenciaDesde.toISOString(),
      administrador_responsable: resultado.administradorResponsable,
    };
  }
}
