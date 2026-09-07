import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreacionUnidadTemporalUseCase } from '../application/use-cases/crear-unidad-temporal.use-case';
import { UnidadTemporalDtoRequest } from '../application/dto/contenidoUnidadTemporal/crear-unidad-temporal.dto-request';
import { UnidadTemporalDtoResponse } from '../application/dto/contenidoUnidadTemporal/crear-unidad-temporal.dto-response';
import { SessionAuthGuard } from '../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../usuarios/presentation/guards/session-scope.guard';
import { RolesGuard } from '../../../shared/presentation/guards/role-guard';
import { AlcancesSesion } from '../../usuarios/presentation/decorators/alcances-sesion.decorator';
import { Roles } from '../../../shared/presentation/decorators/roles.decorator';
import { AlcanceSesion } from '../../usuarios/domain/enums/alcance-sesion.enum';
import { CsrfSessionGuard } from '../../usuarios/presentation/guards/csrf-session.guard';
import { Rol } from '../../usuarios/domain/enums/rol.enum';
import { ActualizarContenidoDtoRequest } from '../application/dto/contenido/actualizar-contenido.dto-request';
import { ContenidoDtoResponse } from '../application/dto/contenido/contenido.dto-response';
import { CrearContenidoDtoRequest } from '../application/dto/contenido/crear-contenido.dto-request';
import { EliminarContenidoDtoResponse } from '../application/dto/contenido/eliminar-contenido.dto-response';
import { ActualizarContenidoUseCase } from '../application/use-cases/actualizar-contenido.use-case';
import { CrearContenidoUseCase } from '../application/use-cases/crear-contenido.use-case';
import { EliminarContenidoUseCase } from '../application/use-cases/eliminar-contenido.use-case';
import { CrearRecursoContenidoDtoRequest } from '../application/dto/recursoContenido/crear-recurso-contenido.dto-request';
import { RecursoContenidoDtoResponse } from '../application/dto/recursoContenido/recurso-contenido.dto-response';
import { CrearRecursoContenidoUseCase } from '../application/use-cases/crear-recurso-contenido.use-case';
import { AsociarContenidoUnidadTemporalUseCase } from '../application/use-cases/asociar-contenido-unidad-temporal.use-case';
import { crearContenidoCronogramaDtoRequest } from '../application/dto/contenidoUnidadTemporal/crear-contenido-cronograma.dto-request';
import { crearContenidoCronogramaDtoResponse } from '../application/dto/contenidoUnidadTemporal/crear-contenido-cronograma.dto-response.dto';
import { ActualizarDisponibilidadContenidoUseCase } from '../application/use-cases/actualizar-disponibilidad-contenido.use-case';
import { ActualizarDisponibilidadContenidoDtoRequest } from '../application/dto/contenido/actualizar-disponibilidad-contenido.dto-request';
import { ActualizarDisponibilidadContenidoDtoResponse } from '../application/dto/contenido/actualizar-disponibilidad-contenido.dto-response';
import { SolicitarUrlSubidaRecursoDtoRequest } from '../application/dto/recursoContenido/solicitar-url-subida-recurso.dto-request';
import { UrlSubidaRecursoDtoResponse } from '../application/dto/recursoContenido/url-subida-recurso.dto-response';
import { SolicitarUrlSubidaRecursoUseCase } from '../application/use-cases/solicitar-url-subida-recurso.use-case';
import { ListarModulosDestinoUseCase } from '../application/use-cases/listar-modulos-destino.use-case';
import { ModuloDestinoDtoResponse } from '../application/dto/modulosDestino/modulo-destino.dto-response';
import { ReordenarRecursosContenidoDtoRequest } from '../application/dto/recursoContenido/reordenar-recursos-contenido.dto-request';
import { ReordenarRecursosContenidoDtoResponse } from '../application/dto/recursoContenido/reordenar-recursos-contenido.dto-response';
import { ReordenarRecursosContenidoUseCase } from '../application/use-cases/reordenar-recursos-contenido.use-case';
import { ActualizarUnidadTemporalUseCase } from '../application/use-cases/actualizar-unidad-temporal.use-case';
import { ActualizarUnidadTemporalDtoRequest } from '../application/dto/unidadTemporal/actualizar-unidad-temporal.dto-request';
import { ActualizarUnidadTemporalDtoResponse } from '../application/dto/unidadTemporal/actualizar-unidad-temporal.dto-response';
import { EliminarAsociacionContenidoUnidadTemporalDtoResponse } from '../application/dto/contenidoUnidadTemporal/eliminar-asociacion-contenido-unidad-temporal.dto-response';
import { EliminarAsociacionContenidoUnidadTemporalDtoRequest } from '../application/dto/contenidoUnidadTemporal/eliminar-asociacion-contenido-unidad-temporal.dto-request';
import { EliminarAsociacionContenidoUnidadTemporalUseCase } from '../application/use-cases/eliminar-asosiacion-contenido-unidad-temporal.use-case';
import { RegistrarPausaAdministrativaDtoRequest } from '../application/dto/pausaAdministrativa/registrar-pausa-administrativa.dto-request';
import { RegistrarPausaAdministrativaDtoResponse } from '../application/dto/pausaAdministrativa/registrar-pausa-administrativa.dto-response';
import { RegistrarPausaAdministrativaUseCase } from '../application/use-cases/registrar-pausa-administrativa.use-case';
import type { AuthenticatedSessionRequest } from '../../usuarios/presentation/http/authenticated-session-request';

@Controller('/cronograma')
export class CronogramaController {
  constructor(
    private readonly creacionUnidadTemporalUseCase: CreacionUnidadTemporalUseCase,
    private readonly crearContenidoUseCase: CrearContenidoUseCase,
    private readonly actualizarContenidoUseCase: ActualizarContenidoUseCase,
    private readonly eliminarContenidoUseCase: EliminarContenidoUseCase,
    private readonly crearRecursoContenidoUseCase: CrearRecursoContenidoUseCase,
    private readonly solicitarUrlSubidaRecursoUseCase: SolicitarUrlSubidaRecursoUseCase,
    private readonly listarModulosDestinoUseCase: ListarModulosDestinoUseCase,
    private readonly reordenarRecursosContenidoUseCase: ReordenarRecursosContenidoUseCase,
    private readonly asociarContenidoUnidadTemporalUseCase: AsociarContenidoUnidadTemporalUseCase,
    private readonly actualizarDisponibilidadContenido: ActualizarDisponibilidadContenidoUseCase,
    private readonly actualizarUnidadTemporalUseCase: ActualizarUnidadTemporalUseCase,
    private readonly eliminarAsociacionContenidoUnidadTemporalUseCase: EliminarAsociacionContenidoUnidadTemporalUseCase,
    private readonly registrarPausaAdministrativaUseCase: RegistrarPausaAdministrativaUseCase,
  ) {}

  @Post('/crear/unidad-temporal')
  @AlcancesSesion(AlcanceSesion.COMPLETA)
  @Roles('ADMINISTRATIVO')
  @UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard, CsrfSessionGuard)
  async crearUnidadTemporal(
    @Body() dto: UnidadTemporalDtoRequest,
  ): Promise<UnidadTemporalDtoResponse> {
    return this.creacionUnidadTemporalUseCase.execute(dto);
  }

  @Post('/contenidos')
  @AlcancesSesion(AlcanceSesion.COMPLETA)
  @Roles(Rol.ADMINISTRATIVO)
  @UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard, CsrfSessionGuard)
  async crearContenido(
    @Body() dto: CrearContenidoDtoRequest,
  ): Promise<ContenidoDtoResponse> {
    return this.crearContenidoUseCase.execute(dto);
  }

  @Patch('/contenidos/:id_contenido')
  @AlcancesSesion(AlcanceSesion.COMPLETA)
  @Roles(Rol.ADMINISTRATIVO)
  @UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard, CsrfSessionGuard)
  async actualizarContenido(
    @Param('id_contenido', new ParseUUIDPipe()) idContenido: string,
    @Body() dto: ActualizarContenidoDtoRequest,
  ): Promise<ContenidoDtoResponse> {
    return this.actualizarContenidoUseCase.execute(idContenido, dto);
  }

  @Delete('/contenidos/:id_contenido')
  @AlcancesSesion(AlcanceSesion.COMPLETA)
  @Roles(Rol.ADMINISTRATIVO)
  @UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard, CsrfSessionGuard)
  async eliminarContenido(
    @Param('id_contenido', new ParseUUIDPipe()) idContenido: string,
  ): Promise<EliminarContenidoDtoResponse> {
    return this.eliminarContenidoUseCase.execute(idContenido);
  }

  @Post('/recursos/url-subida')
  @AlcancesSesion(AlcanceSesion.COMPLETA)
  @Roles(Rol.ADMINISTRATIVO)
  @UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard, CsrfSessionGuard)
  async solicitarUrlSubidaRecurso(
    @Body() dto: SolicitarUrlSubidaRecursoDtoRequest,
  ): Promise<UrlSubidaRecursoDtoResponse> {
    return this.solicitarUrlSubidaRecursoUseCase.execute(dto);
  }

  @Get('/modulos-destino')
  @AlcancesSesion(AlcanceSesion.COMPLETA)
  @Roles(Rol.ADMINISTRATIVO)
  @UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
  async listarModulosDestino(): Promise<ModuloDestinoDtoResponse[]> {
    return this.listarModulosDestinoUseCase.execute();
  }

  @Post('/recursos')
  @AlcancesSesion(AlcanceSesion.COMPLETA)
  @Roles(Rol.ADMINISTRATIVO)
  @UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard, CsrfSessionGuard)
  async crearRecursoContenido(
    @Body() dto: CrearRecursoContenidoDtoRequest,
  ): Promise<RecursoContenidoDtoResponse> {
    return this.crearRecursoContenidoUseCase.execute(dto);
  }

  @Patch('/contenidos/:id_contenido/recursos/orden')
  @AlcancesSesion(AlcanceSesion.COMPLETA)
  @Roles(Rol.ADMINISTRATIVO)
  @UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard, CsrfSessionGuard)
  async reordenarRecursosContenido(
    @Param('id_contenido', new ParseUUIDPipe()) idContenido: string,
    @Body() dto: ReordenarRecursosContenidoDtoRequest,
  ): Promise<ReordenarRecursosContenidoDtoResponse> {
    return this.reordenarRecursosContenidoUseCase.execute(idContenido, dto);
  }

  @Post('/asociar-contenido-unidad-temporal')
  @Roles(Rol.ADMINISTRATIVO)
  @UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard, CsrfSessionGuard)
  async asociarContenidoUnidadTemporal(
    @Body() dto: crearContenidoCronogramaDtoRequest,
  ): Promise<crearContenidoCronogramaDtoResponse> {
    return this.asociarContenidoUnidadTemporalUseCase.execute(dto);
  }

  @Patch('/actualizar-disponibilidad-contenido')
  @Roles(Rol.ADMINISTRATIVO)
  @UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard, CsrfSessionGuard)
  async actualizarDisponibilidadContenidoAsociado(
    @Body() dto: ActualizarDisponibilidadContenidoDtoRequest,
  ): Promise<ActualizarDisponibilidadContenidoDtoResponse> {
    return this.actualizarDisponibilidadContenido.execute(dto);
  }

  @Patch('/actualizar-unidad-temporal')
  @Roles(Rol.ADMINISTRATIVO)
  @UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard, CsrfSessionGuard)
  async actualizarUnidadTemporal(
    @Body() dto: ActualizarUnidadTemporalDtoRequest,
  ): Promise<ActualizarUnidadTemporalDtoResponse> {
    return this.actualizarUnidadTemporalUseCase.execute(dto);
  }

  @Delete('/eliminar-asociacion-contenido-unidad-temporal')
  @Roles(Rol.ADMINISTRATIVO)
  @UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard, CsrfSessionGuard)
  async eliminarAsociacionContenidoUnidadTemporal(
    @Body() dto: EliminarAsociacionContenidoUnidadTemporalDtoRequest,
  ): Promise<EliminarAsociacionContenidoUnidadTemporalDtoResponse> {
    return this.eliminarAsociacionContenidoUnidadTemporalUseCase.execute(dto);
  }

  @Post('/usuarios/:id_usuario/pausas-administrativas')
  @AlcancesSesion(AlcanceSesion.COMPLETA)
  @Roles(Rol.ADMINISTRATIVO)
  @UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard, CsrfSessionGuard)
  async registrarPausaAdministrativa(
    @Param('id_usuario', new ParseUUIDPipe()) idUsuario: string,
    @Body() dto: RegistrarPausaAdministrativaDtoRequest,
    @Req() request: AuthenticatedSessionRequest,
  ): Promise<RegistrarPausaAdministrativaDtoResponse> {
    return this.registrarPausaAdministrativaUseCase.execute(
      idUsuario,
      request.autenticacion.usuario.id_usuario,
      dto,
    );
  }
}
