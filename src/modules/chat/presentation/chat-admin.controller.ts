import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import {
  ActualizarNodoConversacionalDtoRequest,
  CrearNodoConversacionalDtoRequest,
  ReglaValidacionDtoRequest,
} from '../application/dto/arbol-conversacional.dto-request';
import {
  ActualizarTransicionReutilizableDtoRequest,
  CrearFlujoConversacionalDtoRequest,
  CrearTransicionReutilizableDtoRequest,
} from '../application/dto/chat-admin.dto-request';
import type {
  FlujoConversacionalDtoResponse,
  NodoConversacionalDtoResponse,
} from '../application/dto/arbol-conversacional.dto-response';
import {
  ArbolChatAdminDtoResponse,
  TransicionChatAdminDtoResponse,
  type CatalogosChatDtoResponse,
  type ReglaValidacionDtoResponse,
  type RespuestaChatAdmin,
} from '../application/dto/chat-admin.dto-response';
import {
  ConsultarArbolConversacionalUseCase,
  CrearNodoConversacionalUseCase,
} from '../application/use-cases/gestionar-arbol-conversacional.use-cases';
import {
  ActualizarNodoPorIdUseCase,
  ActualizarTransicionPorIdUseCase,
  ConsultarCatalogosChatUseCase,
  CrearFlujoConversacionalUseCase,
  CrearReglaValidacionUseCase,
  CrearTransicionReutilizableUseCase,
} from '../application/use-cases/gestionar-chat-admin.use-cases';

@Controller('/chat/admin')
@AlcancesSesion(AlcanceSesion.COMPLETA)
@Roles(Rol.ADMINISTRATIVO)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
export class ChatAdminController {
  constructor(
    private readonly crearFlujo: CrearFlujoConversacionalUseCase,
    private readonly consultarArbol: ConsultarArbolConversacionalUseCase,
    private readonly crearNodo: CrearNodoConversacionalUseCase,
    private readonly actualizarNodo: ActualizarNodoPorIdUseCase,
    private readonly crearTransicion: CrearTransicionReutilizableUseCase,
    private readonly actualizarTransicion: ActualizarTransicionPorIdUseCase,
    private readonly consultarCatalogos: ConsultarCatalogosChatUseCase,
    private readonly crearReglaValidacion: CrearReglaValidacionUseCase,
  ) {}

  @Post('/flujos')
  @UseGuards(CsrfSessionGuard)
  async crear(
    @Body() dto: CrearFlujoConversacionalDtoRequest,
    @Req() request: AuthenticatedSessionRequest,
  ): Promise<RespuestaChatAdmin<FlujoConversacionalDtoResponse>> {
    return {
      data: await this.crearFlujo.execute(
        dto,
        request.autenticacion.usuario.id_usuario,
      ),
    };
  }

  @Get('/flujos/:id_flujo')
  @Header('Cache-Control', 'no-store')
  async consultar(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
  ): Promise<RespuestaChatAdmin<ArbolChatAdminDtoResponse>> {
    return {
      data: ArbolChatAdminDtoResponse.crear(
        await this.consultarArbol.execute(idFlujo),
      ),
    };
  }

  @Post('/flujos/:id_flujo/nodos')
  @UseGuards(CsrfSessionGuard)
  async agregarNodo(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
    @Body() dto: CrearNodoConversacionalDtoRequest,
    @Req() request: AuthenticatedSessionRequest,
  ): Promise<RespuestaChatAdmin<NodoConversacionalDtoResponse>> {
    return {
      data: await this.crearNodo.execute(
        idFlujo,
        dto,
        request.autenticacion.usuario.id_usuario,
      ),
    };
  }

  @Patch('/nodos/:id_nodo')
  @UseGuards(CsrfSessionGuard)
  async editarNodo(
    @Param('id_nodo', new ParseUUIDPipe()) idNodo: string,
    @Body() dto: ActualizarNodoConversacionalDtoRequest,
    @Req() request: AuthenticatedSessionRequest,
  ): Promise<RespuestaChatAdmin<NodoConversacionalDtoResponse>> {
    return {
      data: await this.actualizarNodo.execute(
        idNodo,
        dto,
        request.autenticacion.usuario.id_usuario,
      ),
    };
  }

  @Post('/flujos/:id_flujo/transiciones')
  @UseGuards(CsrfSessionGuard)
  async agregarTransicion(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
    @Body() dto: CrearTransicionReutilizableDtoRequest,
    @Req() request: AuthenticatedSessionRequest,
  ): Promise<RespuestaChatAdmin<TransicionChatAdminDtoResponse>> {
    return {
      data: TransicionChatAdminDtoResponse.crear(
        await this.crearTransicion.execute(
          idFlujo,
          dto,
          request.autenticacion.usuario.id_usuario,
        ),
      ),
    };
  }

  @Patch('/transiciones/:id_regla')
  @UseGuards(CsrfSessionGuard)
  async editarTransicion(
    @Param('id_regla', new ParseUUIDPipe()) idTransicion: string,
    @Body() dto: ActualizarTransicionReutilizableDtoRequest,
    @Req() request: AuthenticatedSessionRequest,
  ): Promise<RespuestaChatAdmin<TransicionChatAdminDtoResponse>> {
    return {
      data: TransicionChatAdminDtoResponse.crear(
        await this.actualizarTransicion.execute(
          idTransicion,
          dto,
          request.autenticacion.usuario.id_usuario,
        ),
      ),
    };
  }

  @Get('/catalogos')
  @Header('Cache-Control', 'no-store')
  async catalogos(): Promise<RespuestaChatAdmin<CatalogosChatDtoResponse>> {
    return { data: await this.consultarCatalogos.execute() };
  }

  @Patch('/reglas-validacion')
  @HttpCode(201)
  @UseGuards(CsrfSessionGuard)
  async agregarRegla(
    @Body() dto: ReglaValidacionDtoRequest,
    @Req() request: AuthenticatedSessionRequest,
  ): Promise<RespuestaChatAdmin<ReglaValidacionDtoResponse>> {
    return {
      data: await this.crearReglaValidacion.execute(
        dto,
        request.autenticacion.usuario.id_usuario,
      ),
    };
  }
}
