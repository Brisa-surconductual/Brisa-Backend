import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CsrfSessionGuard } from '../../../../usuarios/presentation/guards/csrf-session.guard';
import {
  ArbolConversacionalDtoResponse,
  FlujoConversacionalDtoResponse,
} from '../../../application/dto/arbol-conversacional.dto-response';
import {
  ConsultarPerfilArbolDtoRequest,
  CrearArbolPersonalizadoDtoRequest,
} from '../../../application/dto/arbol-personalizado.dto-request';
import {
  AuditoriaArbolDtoResponse,
  HistorialArbolesPersonalizadosDtoResponse,
} from '../../../application/dto/arbol-personalizado.dto-response';
import {
  ClonacionFlujoDtoResponse,
  NuevaVersionFlujoDtoResponse,
} from '../../../application/dto/gestion-flujos.dto-response';
import { ArchivarFlujoUseCase } from '../../../application/use-cases/arbol-conversacional/archivar-flujo.use-case';
import { ClonarVersionFlujoUseCase } from '../../../application/use-cases/arbol-conversacional/clonar-version-flujo.use-case';
import { ConsultarArbolConversacionalUseCase } from '../../../application/use-cases/arbol-conversacional/consultar-arbol-conversacional.use-case';
import { CrearFlujoConversacionalUseCase } from '../../../application/use-cases/arbol-conversacional/crear-flujo-conversacional.use-case';
import { PublicarFlujoUseCase } from '../../../application/use-cases/arbol-conversacional/publicar-flujo.use-case';
import { ConsultarAuditoriaArbolUseCase } from '../../../application/use-cases/arbol-personalizado/consultar-auditoria-arbol.use-case';
import { ConsultarPublicadoPersonalizadoUseCase } from '../../../application/use-cases/arbol-personalizado/consultar-publicado-personalizado.use-case';
import { ListarArbolesPersonalizadosUseCase } from '../../../application/use-cases/arbol-personalizado/listar-arboles-personalizados.use-case';
import { RechazarEliminacionArbolPersonalizadoUseCase } from '../../../application/use-cases/arbol-personalizado/rechazar-eliminacion-arbol-personalizado.use-case';
import { AccesoAdministrativo } from '../../decorators/acceso.decorators';
import { IdUsuarioSesion } from '../../decorators/id-usuario-sesion.decorator';
import { RespuestaHttp } from '../../interceptors/respuesta-http.interceptor';

/** RF-25C: árboles conversacionales personalizados por combinación de perfil clínico. */
@Controller('/chat/administracion/arboles-personalizados')
@AccesoAdministrativo()
export class ArbolesPersonalizadosController {
  constructor(
    private readonly crearFlujo: CrearFlujoConversacionalUseCase,
    private readonly consultarArbol: ConsultarArbolConversacionalUseCase,
    private readonly clonarVersion: ClonarVersionFlujoUseCase,
    private readonly publicarFlujo: PublicarFlujoUseCase,
    private readonly archivarFlujo: ArchivarFlujoUseCase,
    private readonly listarArboles: ListarArbolesPersonalizadosUseCase,
    private readonly consultarPublicado: ConsultarPublicadoPersonalizadoUseCase,
    private readonly consultarAuditoria: ConsultarAuditoriaArbolUseCase,
    private readonly rechazarEliminacion: RechazarEliminacionArbolPersonalizadoUseCase,
  ) {}

  @Post()
  @UseGuards(CsrfSessionGuard)
  crear(
    @Body() dto: CrearArbolPersonalizadoDtoRequest,
    @IdUsuarioSesion() idUsuario: string,
  ): Promise<FlujoConversacionalDtoResponse> {
    return this.crearFlujo.execute(dto, idUsuario);
  }

  @Get()
  @Header('Cache-Control', 'no-store')
  listar(): Promise<HistorialArbolesPersonalizadosDtoResponse> {
    return this.listarArboles.execute();
  }

  @Get('/publicado')
  @Header('Cache-Control', 'no-store')
  publicado(
    @Query() perfil: ConsultarPerfilArbolDtoRequest,
  ): Promise<FlujoConversacionalDtoResponse | null> {
    return this.consultarPublicado.execute(perfil);
  }

  @Get('/:id_flujo')
  @Header('Cache-Control', 'no-store')
  consultar(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
  ): Promise<ArbolConversacionalDtoResponse> {
    return this.consultarArbol.execute(idFlujo);
  }

  @Get('/:id_flujo/auditoria')
  @Header('Cache-Control', 'no-store')
  auditoria(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
  ): Promise<AuditoriaArbolDtoResponse[]> {
    return this.consultarAuditoria.execute(idFlujo);
  }

  @Post('/:id_flujo/nueva-version')
  @UseGuards(CsrfSessionGuard)
  @RespuestaHttp({ dto: NuevaVersionFlujoDtoResponse })
  nuevaVersion(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
    @IdUsuarioSesion() idUsuario: string,
  ): Promise<ClonacionFlujoDtoResponse> {
    return this.clonarVersion.execute(idFlujo, idUsuario);
  }

  @Post('/:id_flujo/publicar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CsrfSessionGuard)
  publicar(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
    @IdUsuarioSesion() idUsuario: string,
  ): Promise<FlujoConversacionalDtoResponse> {
    return this.publicarFlujo.execute(idFlujo, idUsuario);
  }

  @Post('/:id_flujo/archivar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CsrfSessionGuard)
  archivar(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
    @IdUsuarioSesion() idUsuario: string,
  ): Promise<FlujoConversacionalDtoResponse> {
    return this.archivarFlujo.execute(idFlujo, idUsuario);
  }

  @Delete('/:id_flujo')
  @UseGuards(CsrfSessionGuard)
  eliminar(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
  ): Promise<never> {
    return this.rechazarEliminacion.execute(idFlujo);
  }
}
