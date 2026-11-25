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
import { Roles } from '../../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../../shared/presentation/guards/role-guard';
import { AlcanceSesion } from '../../../usuarios/domain/enums/alcance-sesion.enum';
import { Rol } from '../../../usuarios/domain/enums/rol.enum';
import { AlcancesSesion } from '../../../usuarios/presentation/decorators/alcances-sesion.decorator';
import { SessionAuthGuard } from '../../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../../usuarios/presentation/guards/session-scope.guard';
import type { AuthenticatedSessionRequest } from '../../../usuarios/presentation/http/authenticated-session-request';
import { ConsultarVistaNarrativaUseCase } from '../../application/use-cases/consultar-vista-narrativa.use-case';
import { ConsultarVistaNotificacionesUseCase } from '../../application/use-cases/consultar-vista-notificaciones.use-case';
import { ConsultarVistaConductualUseCase } from '../../application/use-cases/consultar-vista-conductual.use-case';
import { ConsultarVistasFiltradasUseCase } from '../../application/use-cases/consultar-vistas-filtradas.use-case';
import { TipoVistaAgregada } from '../../domain/enums/tipo-vista-agregada.enum';
import {
  leerFiltrosAgregados,
  leerVistaObjetivo,
} from '../http/filtros-agregados.query';
import { contextoAuditoria } from '../http/contexto-auditoria';

@Controller('admin/cohortes/:id_cohorte/vistas')
@Roles(Rol.ADMINISTRATIVO, Rol.COORDINADOR_PSI)
@AlcancesSesion(AlcanceSesion.COMPLETA)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
export class VistasAgregadasController {
  constructor(
    private readonly narrativa: ConsultarVistaNarrativaUseCase,
    private readonly notificaciones: ConsultarVistaNotificacionesUseCase,
    private readonly conductual: ConsultarVistaConductualUseCase,
    private readonly filtradas: ConsultarVistasFiltradasUseCase,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  obtenerVistas(
    @Param('id_cohorte', ParseUUIDPipe) id: string,
    @Query() query: Record<string, unknown>,
    @Req() request: AuthenticatedSessionRequest,
  ) {
    return this.filtradas.ejecutar(
      contextoAuditoria(request),
      id.toLowerCase(),
      leerFiltrosAgregados(query),
      leerVistaObjetivo(query.vista_objetivo),
    );
  }

  @Get('conductual')
  @Header('Cache-Control', 'no-store')
  obtenerConductual(
    @Param('id_cohorte', ParseUUIDPipe) id: string,
    @Query() query: Record<string, unknown>,
    @Req() request: AuthenticatedSessionRequest,
  ) {
    return this.obtenerIndividual(
      id,
      query,
      request,
      TipoVistaAgregada.CONDUCTUAL,
    );
  }

  @Get('narrativa')
  @Header('Cache-Control', 'no-store')
  obtenerNarrativa(
    @Param('id_cohorte', ParseUUIDPipe) idCohorte: string,
    @Req() request: AuthenticatedSessionRequest,
    @Query() query: Record<string, unknown>,
  ) {
    return this.obtenerIndividual(
      idCohorte,
      query,
      request,
      TipoVistaAgregada.NARRATIVA,
    );
  }

  @Get('notificaciones')
  @Header('Cache-Control', 'no-store')
  obtenerNotificaciones(
    @Param('id_cohorte', ParseUUIDPipe) idCohorte: string,
    @Req() request: AuthenticatedSessionRequest,
    @Query() query: Record<string, unknown>,
  ) {
    return this.obtenerIndividual(
      idCohorte,
      query,
      request,
      TipoVistaAgregada.NOTIFICACIONES,
    );
  }

  private async obtenerIndividual(
    id: string,
    query: Record<string, unknown>,
    request: AuthenticatedSessionRequest,
    tipo: TipoVistaAgregada,
  ) {
    const ctx = contextoAuditoria(request);
    const filtros = leerFiltrosAgregados(query);
    const idCohorte = id.toLowerCase();
    if (Object.keys(filtros).length > 0)
      return this.filtradas.consultarIndividual(ctx, idCohorte, filtros, tipo);

    const casosBase = {
      CONDUCTUAL: this.conductual,
      NARRATIVA: this.narrativa,
      NOTIFICACIONES: this.notificaciones,
    };
    const vista = await casosBase[tipo].ejecutar(ctx, idCohorte);
    return { ...vista, filtros_aplicados: {}, filtros_omitidos: [] };
  }
}
