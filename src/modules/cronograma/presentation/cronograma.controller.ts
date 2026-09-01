import { Body, Controller, Delete, Param, ParseUUIDPipe, Patch, Post, UseGuards, } from '@nestjs/common';
import { CreacionUnidadTemporalUseCase } from '../application/use-cases/crear-unidad-temporal.use-case';
import { UnidadTemporalDtoRequest } from '../application/dto/crear-unidad-temporal.dto-request';
import { UnidadTemporalDtoResponse } from '../application/dto/crear-unidad-temporal.dto-response';
import { SessionAuthGuard } from '../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../usuarios/presentation/guards/session-scope.guard';
import { RolesGuard } from '../../../shared/presentation/guards/role-guard';
import { AlcancesSesion } from '../../usuarios/presentation/decorators/alcances-sesion.decorator';
import { Roles } from '../../../shared/presentation/decorators/roles.decorator';
import { AlcanceSesion } from '../../usuarios/domain/enums/alcance-sesion.enum';
import { CsrfSessionGuard } from '../../usuarios/presentation/guards/csrf-session.guard';
import { Rol } from '../../usuarios/domain/enums/rol.enum';
import { ActualizarContenidoDtoRequest } from '../application/dto/actualizar-contenido.dto-request';
import { ContenidoDtoResponse } from '../application/dto/contenido.dto-response';
import { CrearContenidoDtoRequest } from '../application/dto/crear-contenido.dto-request';
import { EliminarContenidoDtoResponse } from '../application/dto/eliminar-contenido.dto-response';
import { ActualizarContenidoUseCase } from '../application/use-cases/actualizar-contenido.use-case';
import { CrearContenidoUseCase } from '../application/use-cases/crear-contenido.use-case';
import { EliminarContenidoUseCase } from '../application/use-cases/eliminar-contenido.use-case';
import { CrearRecursoContenidoDtoRequest } from '../application/dto/crear-recurso-contenido.dto-request';
import { RecursoContenidoDtoResponse } from '../application/dto/recurso-contenido.dto-response';
import { CrearRecursoContenidoUseCase } from '../application/use-cases/crear-recurso-contenido.use-case';
import { AsociarContenidoUnidadTemporalUseCase } from '../application/use-cases/asociar-contenido-unidad-temporal.use-case';
import {crearContenidoCronogramaDtoRequest} from "../application/dto/crear-contenido-cronograma.dto-request";
import {crearContenidoCronogramaDtoResponse} from "../application/dto/crear-contenido-cronograma.dto-response.dto";
import {ActualizarDisponibilidadContenidoUseCase} from "../application/use-cases/actualizar-disponibilidad-contenido.use-case";
import { ActualizarDisponibilidadContenidoDtoRequest } from '../application/dto/actualizar-disponibilidad-contenido.dto-request';
import { ActualizarDisponibilidadContenidoDtoResponse } from '../application/dto/actualizar-disponibilidad-contenido.dto-response';

@Controller('/cronograma')
export class CronogramaController {
  constructor(
    private readonly creacionUnidadTemporalUseCase: CreacionUnidadTemporalUseCase,
    private readonly crearContenidoUseCase: CrearContenidoUseCase,
    private readonly actualizarContenidoUseCase: ActualizarContenidoUseCase,
    private readonly eliminarContenidoUseCase: EliminarContenidoUseCase,
    private readonly crearRecursoContenidoUseCase: CrearRecursoContenidoUseCase,
    private readonly asociarContenidoUnidadTemporalUseCase: AsociarContenidoUnidadTemporalUseCase,
    private readonly actualizarDisponibilidadContenido: ActualizarDisponibilidadContenidoUseCase,
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

  @Post('/recursos')
  @AlcancesSesion(AlcanceSesion.COMPLETA)
  @Roles(Rol.ADMINISTRATIVO)
  @UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard, CsrfSessionGuard)
  async crearRecursoContenido(
    @Body() dto: CrearRecursoContenidoDtoRequest,
  ): Promise<RecursoContenidoDtoResponse> {
    return this.crearRecursoContenidoUseCase.execute(dto);
  }

  @Post('/asociar-contenido-unidad-temporal')
  @Roles(Rol.ADMINISTRATIVO)
  @UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard, CsrfSessionGuard)
  async asociarContenidoUnidadTemporal( @Body() dto: crearContenidoCronogramaDtoRequest): Promise<crearContenidoCronogramaDtoResponse> {
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

}