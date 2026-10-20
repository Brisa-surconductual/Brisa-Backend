import {
  Controller,
  Get,
  Header,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../shared/presentation/guards/role-guard';
import { AlcanceSesion } from '../../usuarios/domain/enums/alcance-sesion.enum';
import { Rol } from '../../usuarios/domain/enums/rol.enum';
import { AlcancesSesion } from '../../usuarios/presentation/decorators/alcances-sesion.decorator';
import { SessionAuthGuard } from '../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../usuarios/presentation/guards/session-scope.guard';
import {
  ConsultarElegibilidadModalidadUseCase,
  type ElegibilidadModalidadPrograma,
} from '../application/use-cases/consultar-elegibilidad-modalidad.use-case';

interface ElegibilidadModalidadDtoResponse {
  readonly id_programa: number;
  readonly modalidad_actual: ElegibilidadModalidadPrograma['modalidadActual'];
  readonly total_usuarios_activos: number;
  readonly con_perfil_completo: number;
  readonly sin_perfil_completo: number;
  readonly elegible: boolean;
}

@Controller('/chat/admin/modalidad')
@AlcancesSesion(AlcanceSesion.COMPLETA)
@Roles(Rol.ADMINISTRATIVO)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
export class ModalidadProgramaAdminController {
  constructor(
    private readonly consultarElegibilidad: ConsultarElegibilidadModalidadUseCase,
  ) {}

  @Get('/elegibilidad')
  @Header('Cache-Control', 'no-store')
  async consultarElegibilidadPrograma(
    @Query('id_programa', new ParseIntPipe()) idPrograma: number,
  ): Promise<ElegibilidadModalidadDtoResponse> {
    const resultado = await this.consultarElegibilidad.execute(idPrograma);

    return {
      id_programa: resultado.idPrograma,
      modalidad_actual: resultado.modalidadActual,
      total_usuarios_activos: resultado.totalUsuariosActivos,
      con_perfil_completo: resultado.conPerfilCompleto,
      sin_perfil_completo: resultado.sinPerfilCompleto,
      elegible: resultado.elegible,
    };
  }
}
