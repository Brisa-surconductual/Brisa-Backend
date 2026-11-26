import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../../../shared/presentation/guards/role-guard';
import { AlcanceSesion } from '../../../../usuarios/domain/enums/alcance-sesion.enum';
import { Rol } from '../../../../usuarios/domain/enums/rol.enum';
import { AlcancesSesion } from '../../../../usuarios/presentation/decorators/alcances-sesion.decorator';
import { SessionAuthGuard } from '../../../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../../../usuarios/presentation/guards/session-scope.guard';
import type { AuthenticatedSessionRequest } from '../../../../usuarios/presentation/http/authenticated-session-request';
import type { ListadoIndicadoresDtoResponse } from '../../../application/dto/listado-indicadores/listado-indicadores.dto-response';
import { ListadoIndicadoresException } from '../../../application/exceptions/listado-indicadores.exception';
import { ListarIndicadoresParticipantesUseCase } from '../../../application/use-cases/listado-indicadores/listar-indicadores-participantes.use-case';
import { contextoAuditoria } from '../../http/contexto-auditoria';
import { leerConsultaListado } from '../../http/listado-indicadores.query';

const idCohorteValido = new ParseUUIDPipe({
  exceptionFactory: () =>
    new ListadoIndicadoresException('PARAMETRO_INVALIDO', {
      mensaje: 'El identificador de la cohorte no es válido.',
    }),
});

/**
 * RF-142: listado de indicadores de los participantes de una cohorte, en solo
 * lectura. No exige permiso individual (solo seudónimos e indicadores).
 */
@Controller('admin/cohortes/:id_cohorte/participantes/indicadores')
@Roles(Rol.ADMINISTRATIVO, Rol.COORDINADOR_PSI)
@AlcancesSesion(AlcanceSesion.COMPLETA)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
export class IndicadoresParticipantesController {
  constructor(private readonly listar: ListarIndicadoresParticipantesUseCase) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async consultar(
    @Param('id_cohorte', idCohorteValido) idCohorte: string,
    // Record (no DTO): el ValidationPipe global no la procesa y un parámetro
    // no permitido no da 400; la valida `leerConsultaListado` con whitelist.
    @Query() query: Record<string, unknown>,
    @Req() request: AuthenticatedSessionRequest,
  ): Promise<ListadoIndicadoresDtoResponse> {
    return this.listar.execute(
      contextoAuditoria(request),
      idCohorte.toLowerCase(),
      await leerConsultaListado(query, request.body),
    );
  }
}
