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
import { TransicionConversacionalDtoResponse } from '../../../application/dto/arbol-conversacional.dto-response';
import {
  ActualizarTransicionConversacionalDtoRequest,
  CrearTransicionConversacionalDtoRequest,
} from '../../../application/dto/chat-admin.dto-request';
import { TransicionChatAdminDtoResponse } from '../../../application/dto/chat-admin.dto-response';
import { ActualizarTransicionConversacionalUseCase } from '../../../application/use-cases/arbol-conversacional/actualizar-transicion-conversacional.use-case';
import { CrearTransicionConversacionalUseCase } from '../../../application/use-cases/arbol-conversacional/crear-transicion-conversacional.use-case';
import { AccesoAdministrativo } from '../../decorators/acceso.decorators';
import { IdUsuarioSesion } from '../../decorators/id-usuario-sesion.decorator';
import { RespuestaHttp } from '../../interceptors/respuesta-http.interceptor';

/** Transiciones entre los nodos de un flujo conversacional. */
@Controller('/chat')
@AccesoAdministrativo()
export class TransicionesConversacionalesController {
  constructor(
    private readonly crearTransicion: CrearTransicionConversacionalUseCase,
    private readonly actualizarTransicion: ActualizarTransicionConversacionalUseCase,
  ) {}

  @Post('/admin/flujos/:id_flujo/transiciones')
  @UseGuards(CsrfSessionGuard)
  @RespuestaHttp({ dto: TransicionChatAdminDtoResponse, envolver: true })
  agregar(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
    @Body() dto: CrearTransicionConversacionalDtoRequest,
    @IdUsuarioSesion() idUsuario: string,
  ): Promise<TransicionConversacionalDtoResponse> {
    return this.crearTransicion.execute(idFlujo, dto, idUsuario);
  }

  @Patch('/admin/transiciones/:id_regla')
  @UseGuards(CsrfSessionGuard)
  @RespuestaHttp({ dto: TransicionChatAdminDtoResponse, envolver: true })
  editar(
    @Param('id_regla', new ParseUUIDPipe()) idTransicion: string,
    @Body() dto: ActualizarTransicionConversacionalDtoRequest,
    @IdUsuarioSesion() idUsuario: string,
  ): Promise<TransicionConversacionalDtoResponse> {
    return this.actualizarTransicion.execute(idTransicion, dto, idUsuario);
  }

  // ── Rutas históricas (/chat/administracion) que el front aún consume ──────

  /** @deprecated Usar POST /chat/admin/flujos/:id_flujo/transiciones. */
  @Post('/administracion/flujos/:id_flujo/transiciones')
  @UseGuards(CsrfSessionGuard)
  agregarHistorica(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
    @Body() dto: CrearTransicionConversacionalDtoRequest,
    @IdUsuarioSesion() idUsuario: string,
  ): Promise<TransicionConversacionalDtoResponse> {
    return this.crearTransicion.execute(idFlujo, dto, idUsuario);
  }

  /** @deprecated Usar PATCH /chat/admin/transiciones/:id_regla. */
  @Patch('/administracion/flujos/:id_flujo/transiciones/:id_transicion')
  @UseGuards(CsrfSessionGuard)
  editarHistorica(
    @Param('id_flujo', new ParseUUIDPipe()) _idFlujo: string,
    @Param('id_transicion', new ParseUUIDPipe()) idTransicion: string,
    @Body() dto: ActualizarTransicionConversacionalDtoRequest,
    @IdUsuarioSesion() idUsuario: string,
  ): Promise<TransicionConversacionalDtoResponse> {
    return this.actualizarTransicion.execute(idTransicion, dto, idUsuario);
  }
}
