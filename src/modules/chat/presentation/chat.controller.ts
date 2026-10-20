import {
  Body,
  Controller,
  Get,
  Header,
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
  ActualizarTransicionConversacionalDtoRequest,
  CrearFlujoGrupalDtoRequest,
  CrearNodoConversacionalDtoRequest,
  CrearTransicionConversacionalDtoRequest,
} from '../application/dto/arbol-conversacional.dto-request';
import {
  ArbolConversacionalDtoResponse,
  FlujoConversacionalDtoResponse,
  NodoConversacionalDtoResponse,
  TipoNodoDtoResponse,
  TransicionConversacionalDtoResponse,
  ValidacionArbolDtoResponse,
} from '../application/dto/arbol-conversacional.dto-response';
import {
  ActualizarNodoConversacionalUseCase,
  ActualizarTransicionConversacionalUseCase,
  ConsultarArbolConversacionalUseCase,
  CrearFlujoGrupalUseCase,
  CrearNodoConversacionalUseCase,
  CrearTransicionConversacionalUseCase,
  ListarTiposNodoUseCase,
  PublicarArbolConversacionalUseCase,
  ValidarArbolConversacionalUseCase,
} from '../application/use-cases/gestionar-arbol-conversacional.use-cases';

@Controller('/chat/administracion')
@AlcancesSesion(AlcanceSesion.COMPLETA)
@Roles(Rol.ADMINISTRATIVO)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
export class ChatController {
  constructor(
    private readonly crearFlujoGrupalUseCase: CrearFlujoGrupalUseCase,
    private readonly listarTiposNodoUseCase: ListarTiposNodoUseCase,
    private readonly consultarArbolUseCase: ConsultarArbolConversacionalUseCase,
    private readonly crearNodoUseCase: CrearNodoConversacionalUseCase,
    private readonly actualizarNodoUseCase: ActualizarNodoConversacionalUseCase,
    private readonly crearTransicionUseCase: CrearTransicionConversacionalUseCase,
    private readonly actualizarTransicionUseCase: ActualizarTransicionConversacionalUseCase,
    private readonly validarArbolUseCase: ValidarArbolConversacionalUseCase,
    private readonly publicarArbolUseCase: PublicarArbolConversacionalUseCase,
  ) {}

  @Post('/flujos')
  @UseGuards(CsrfSessionGuard)
  crearFlujo(
    @Body() dto: CrearFlujoGrupalDtoRequest,
    @Req() request: AuthenticatedSessionRequest,
  ): Promise<FlujoConversacionalDtoResponse> {
    return this.crearFlujoGrupalUseCase.execute(
      dto,
      request.autenticacion.usuario.id_usuario,
    );
  }

  @Get('/tipos-nodo')
  @Header('Cache-Control', 'no-store')
  listarTiposNodo(): Promise<TipoNodoDtoResponse[]> {
    return this.listarTiposNodoUseCase.execute();
  }

  @Get('/flujos/:id_flujo/arbol')
  @Header('Cache-Control', 'no-store')
  consultarArbol(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
  ): Promise<ArbolConversacionalDtoResponse> {
    return this.consultarArbolUseCase.execute(idFlujo);
  }

  @Post('/flujos/:id_flujo/nodos')
  @UseGuards(CsrfSessionGuard)
  crearNodo(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
    @Body() dto: CrearNodoConversacionalDtoRequest,
    @Req() request: AuthenticatedSessionRequest,
  ): Promise<NodoConversacionalDtoResponse> {
    return this.crearNodoUseCase.execute(
      idFlujo,
      dto,
      request.autenticacion.usuario.id_usuario,
    );
  }

  @Patch('/flujos/:id_flujo/nodos/:id_nodo')
  @UseGuards(CsrfSessionGuard)
  actualizarNodo(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
    @Param('id_nodo', new ParseUUIDPipe()) idNodo: string,
    @Body() dto: ActualizarNodoConversacionalDtoRequest,
    @Req() request: AuthenticatedSessionRequest,
  ): Promise<NodoConversacionalDtoResponse> {
    return this.actualizarNodoUseCase.execute(
      idFlujo,
      idNodo,
      dto,
      request.autenticacion.usuario.id_usuario,
    );
  }

  @Post('/flujos/:id_flujo/transiciones')
  @UseGuards(CsrfSessionGuard)
  crearTransicion(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
    @Body() dto: CrearTransicionConversacionalDtoRequest,
    @Req() request: AuthenticatedSessionRequest,
  ): Promise<TransicionConversacionalDtoResponse> {
    return this.crearTransicionUseCase.execute(
      idFlujo,
      dto,
      request.autenticacion.usuario.id_usuario,
    );
  }

  @Patch('/flujos/:id_flujo/transiciones/:id_transicion')
  @UseGuards(CsrfSessionGuard)
  actualizarTransicion(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
    @Param('id_transicion', new ParseUUIDPipe()) idTransicion: string,
    @Body() dto: ActualizarTransicionConversacionalDtoRequest,
    @Req() request: AuthenticatedSessionRequest,
  ): Promise<TransicionConversacionalDtoResponse> {
    return this.actualizarTransicionUseCase.execute(
      idFlujo,
      idTransicion,
      dto,
      request.autenticacion.usuario.id_usuario,
    );
  }

  @Post('/flujos/:id_flujo/validar')
  @UseGuards(CsrfSessionGuard)
  validarArbol(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
  ): Promise<ValidacionArbolDtoResponse> {
    return this.validarArbolUseCase.execute(idFlujo);
  }

  @Post('/flujos/:id_flujo/publicar')
  @UseGuards(CsrfSessionGuard)
  publicarArbol(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
    @Req() request: AuthenticatedSessionRequest,
  ): Promise<FlujoConversacionalDtoResponse> {
    return this.publicarArbolUseCase.execute(
      idFlujo,
      request.autenticacion.usuario.id_usuario,
    );
  }
}
