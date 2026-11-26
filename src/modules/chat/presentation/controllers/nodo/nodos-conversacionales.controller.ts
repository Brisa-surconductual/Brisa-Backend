import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CsrfSessionGuard } from '../../../../usuarios/presentation/guards/csrf-session.guard';
import {
  ActualizarNodoConversacionalDtoRequest,
  CrearNodoConversacionalDtoRequest,
} from '../../../application/dto/arbol-conversacional.dto-request';
import { NodoConversacionalDtoResponse } from '../../../application/dto/arbol-conversacional.dto-response';
import { ActualizarNodoConversacionalUseCase } from '../../../application/use-cases/arbol-conversacional/actualizar-nodo-conversacional.use-case';
import { CrearNodoConversacionalUseCase } from '../../../application/use-cases/arbol-conversacional/crear-nodo-conversacional.use-case';
import { AccesoAdministrativo } from '../../decorators/acceso.decorators';
import { IdUsuarioSesion } from '../../decorators/id-usuario-sesion.decorator';
import { RespuestaHttp } from '../../interceptors/respuesta-http.interceptor';

/** Nodos de un flujo conversacional. */
@Controller('/chat')
@AccesoAdministrativo()
export class NodosConversacionalesController {
  constructor(
    private readonly crearNodo: CrearNodoConversacionalUseCase,
    private readonly actualizarNodo: ActualizarNodoConversacionalUseCase,
  ) {}

  @Post('/admin/flujos/:id_flujo/nodos')
  @UseGuards(CsrfSessionGuard)
  @RespuestaHttp({ envolver: true })
  agregar(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
    @Body() dto: CrearNodoConversacionalDtoRequest,
    @IdUsuarioSesion() idUsuario: string,
  ): Promise<NodoConversacionalDtoResponse> {
    return this.crearNodo.execute(idFlujo, dto, idUsuario);
  }

  @Patch('/admin/nodos/:id_nodo')
  @UseGuards(CsrfSessionGuard)
  @RespuestaHttp({ envolver: true })
  editar(
    @Param('id_nodo', new ParseUUIDPipe()) idNodo: string,
    @Body() dto: ActualizarNodoConversacionalDtoRequest,
    @IdUsuarioSesion() idUsuario: string,
  ): Promise<NodoConversacionalDtoResponse> {
    return this.actualizarNodo.execute(idNodo, dto, idUsuario);
  }

  // ── Rutas históricas (/chat/administracion) que el front aún consume ──────

  /** @deprecated Usar POST /chat/admin/flujos/:id_flujo/nodos. */
  @Post('/administracion/flujos/:id_flujo/nodos')
  @UseGuards(CsrfSessionGuard)
  agregarHistorico(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
    @Body() dto: CrearNodoConversacionalDtoRequest,
    @IdUsuarioSesion() idUsuario: string,
  ): Promise<NodoConversacionalDtoResponse> {
    return this.crearNodo.execute(idFlujo, dto, idUsuario);
  }

  /** @deprecated Usar PATCH /chat/admin/nodos/:id_nodo. */
  @Patch('/administracion/flujos/:id_flujo/nodos/:id_nodo')
  @UseGuards(CsrfSessionGuard)
  editarHistorico(
    @Param('id_flujo', new ParseUUIDPipe()) _idFlujo: string,
    @Param('id_nodo', new ParseUUIDPipe()) idNodo: string,
    @Body() dto: ActualizarNodoConversacionalDtoRequest,
    @IdUsuarioSesion() idUsuario: string,
  ): Promise<NodoConversacionalDtoResponse> {
    return this.actualizarNodo.execute(idNodo, dto, idUsuario);
  }
}
