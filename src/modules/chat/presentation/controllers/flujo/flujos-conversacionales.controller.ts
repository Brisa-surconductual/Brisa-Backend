import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CsrfSessionGuard } from '../../../../usuarios/presentation/guards/csrf-session.guard';
import { CrearFlujoGrupalDtoRequest } from '../../../application/dto/arbol-conversacional.dto-request';
import {
  FlujoConversacionalDtoResponse,
  ArbolConversacionalDtoResponse,
  ValidacionArbolDtoResponse,
} from '../../../application/dto/arbol-conversacional.dto-response';
import { CrearFlujoConversacionalDtoRequest } from '../../../application/dto/chat-admin.dto-request';
import { ArbolChatAdminDtoResponse } from '../../../application/dto/chat-admin.dto-response';
import { ListarFlujosDtoRequest } from '../../../application/dto/gestion-flujos.dto-request';
import {
  ClonacionFlujoDtoResponse,
  FlujoArchivadoDtoResponse,
  FlujoPublicadoDtoResponse,
  ListadoFlujosDtoResponse,
  VersionClonadaDtoResponse,
} from '../../../application/dto/gestion-flujos.dto-response';
import { ArchivarFlujoUseCase } from '../../../application/use-cases/arbol-conversacional/archivar-flujo.use-case';
import { ClonarVersionFlujoUseCase } from '../../../application/use-cases/arbol-conversacional/clonar-version-flujo.use-case';
import { ConsultarArbolConversacionalUseCase } from '../../../application/use-cases/arbol-conversacional/consultar-arbol-conversacional.use-case';
import { CrearFlujoConversacionalUseCase } from '../../../application/use-cases/arbol-conversacional/crear-flujo-conversacional.use-case';
import { ListarFlujosUseCase } from '../../../application/use-cases/arbol-conversacional/listar-flujos.use-case';
import { PublicarFlujoUseCase } from '../../../application/use-cases/arbol-conversacional/publicar-flujo.use-case';
import { ValidarArbolConversacionalUseCase } from '../../../application/use-cases/arbol-conversacional/validar-arbol-conversacional.use-case';
import { AccesoAdministrativo } from '../../decorators/acceso.decorators';
import { IdUsuarioSesion } from '../../decorators/id-usuario-sesion.decorator';
import { RespuestaHttp } from '../../interceptors/respuesta-http.interceptor';

/** Ciclo de vida de los flujos conversacionales: crear, consultar, validar, publicar, archivar y versionar. */
@Controller('/chat')
@AccesoAdministrativo()
export class FlujosConversacionalesController {
  constructor(
    private readonly crearFlujo: CrearFlujoConversacionalUseCase,
    private readonly listarFlujos: ListarFlujosUseCase,
    private readonly consultarArbol: ConsultarArbolConversacionalUseCase,
    private readonly validarArbol: ValidarArbolConversacionalUseCase,
    private readonly publicarFlujo: PublicarFlujoUseCase,
    private readonly archivarFlujo: ArchivarFlujoUseCase,
    private readonly clonarVersion: ClonarVersionFlujoUseCase,
  ) {}

  @Get('/admin/flujos')
  @Header('Cache-Control', 'no-store')
  listar(
    @Query() dto: ListarFlujosDtoRequest,
  ): Promise<ListadoFlujosDtoResponse> {
    return this.listarFlujos.execute(dto);
  }

  @Post('/admin/flujos')
  @UseGuards(CsrfSessionGuard)
  @RespuestaHttp({ envolver: true })
  crear(
    @Body() dto: CrearFlujoConversacionalDtoRequest,
    @IdUsuarioSesion() idUsuario: string,
  ): Promise<FlujoConversacionalDtoResponse> {
    return this.crearFlujo.execute(dto, idUsuario);
  }

  @Get('/admin/flujos/:id_flujo')
  @Header('Cache-Control', 'no-store')
  @RespuestaHttp({ dto: ArbolChatAdminDtoResponse, envolver: true })
  consultar(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
  ): Promise<ArbolConversacionalDtoResponse> {
    return this.consultarArbol.execute(idFlujo);
  }

  @Post('/admin/flujos/:id_flujo/validar')
  @HttpCode(200)
  @UseGuards(CsrfSessionGuard)
  @RespuestaHttp({ envolver: true })
  validar(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
  ): Promise<ValidacionArbolDtoResponse> {
    return this.validarArbol.execute(idFlujo);
  }

  @Post('/admin/flujos/:id_flujo/publicar')
  @HttpCode(200)
  @UseGuards(CsrfSessionGuard)
  @RespuestaHttp({ dto: FlujoPublicadoDtoResponse, envolver: true })
  publicar(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
    @IdUsuarioSesion() idUsuario: string,
  ): Promise<FlujoConversacionalDtoResponse> {
    return this.publicarFlujo.execute(idFlujo, idUsuario);
  }

  @Post('/admin/flujos/:id_flujo/archivar')
  @HttpCode(200)
  @UseGuards(CsrfSessionGuard)
  @RespuestaHttp({ dto: FlujoArchivadoDtoResponse, envolver: true })
  archivar(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
    @IdUsuarioSesion() idUsuario: string,
  ): Promise<FlujoConversacionalDtoResponse> {
    return this.archivarFlujo.execute(idFlujo, idUsuario);
  }

  @Post('/admin/flujos/:id_flujo/clonar-version')
  @UseGuards(CsrfSessionGuard)
  @RespuestaHttp({ dto: VersionClonadaDtoResponse, envolver: true })
  clonar(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
    @IdUsuarioSesion() idUsuario: string,
  ): Promise<ClonacionFlujoDtoResponse> {
    return this.clonarVersion.execute(idFlujo, idUsuario);
  }

  // ── Rutas históricas (/chat/administracion) que el front aún consume ──────

  /** @deprecated Usar POST /chat/admin/flujos. */
  @Post('/administracion/flujos')
  @UseGuards(CsrfSessionGuard)
  crearGrupalHistorico(
    @Body() dto: CrearFlujoGrupalDtoRequest,
    @IdUsuarioSesion() idUsuario: string,
  ): Promise<FlujoConversacionalDtoResponse> {
    return this.crearFlujo.execute(dto, idUsuario);
  }

  /** @deprecated Usar GET /chat/admin/flujos/:id_flujo. */
  @Get('/administracion/flujos/:id_flujo/arbol')
  @Header('Cache-Control', 'no-store')
  consultarHistorico(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
  ): Promise<ArbolConversacionalDtoResponse> {
    return this.consultarArbol.execute(idFlujo);
  }

  /** @deprecated Usar POST /chat/admin/flujos/:id_flujo/validar. */
  @Post('/administracion/flujos/:id_flujo/validar')
  @UseGuards(CsrfSessionGuard)
  validarHistorico(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
  ): Promise<ValidacionArbolDtoResponse> {
    return this.validarArbol.execute(idFlujo);
  }

  /** @deprecated Usar POST /chat/admin/flujos/:id_flujo/publicar. */
  @Post('/administracion/flujos/:id_flujo/publicar')
  @UseGuards(CsrfSessionGuard)
  publicarHistorico(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
    @IdUsuarioSesion() idUsuario: string,
  ): Promise<FlujoConversacionalDtoResponse> {
    return this.publicarFlujo.execute(idFlujo, idUsuario);
  }
}
