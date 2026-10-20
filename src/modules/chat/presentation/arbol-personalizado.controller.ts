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
  ArbolConversacionalDtoResponse,
  FlujoConversacionalDtoResponse,
} from '../application/dto/arbol-conversacional.dto-response';
import {
  ConsultarPerfilArbolDtoRequest,
  CrearArbolPersonalizadoDtoRequest,
} from '../application/dto/arbol-personalizado.dto-request';
import {
  AuditoriaArbolDtoResponse,
  HistorialArbolesPersonalizadosDtoResponse,
} from '../application/dto/arbol-personalizado.dto-response';
import {
  ArchivarArbolPersonalizadoUseCase,
  ClonarVersionPersonalizadaUseCase,
  ConsultarArbolPersonalizadoUseCase,
  ConsultarAuditoriaArbolUseCase,
  ConsultarPublicadoPersonalizadoUseCase,
  CrearArbolPersonalizadoUseCase,
  ListarArbolesPersonalizadosUseCase,
  PublicarArbolPersonalizadoUseCase,
  RechazarEliminacionArbolPersonalizadoUseCase,
} from '../application/use-cases/gestionar-arbol-personalizado.use-cases';

@Controller('/chat/administracion/arboles-personalizados')
@AlcancesSesion(AlcanceSesion.COMPLETA)
@Roles(Rol.ADMINISTRATIVO)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
export class ArbolPersonalizadoController {
  constructor(
    private readonly crearUseCase: CrearArbolPersonalizadoUseCase,
    private readonly clonarUseCase: ClonarVersionPersonalizadaUseCase,
    private readonly listarUseCase: ListarArbolesPersonalizadosUseCase,
    private readonly consultarUseCase: ConsultarArbolPersonalizadoUseCase,
    private readonly consultarPublicadoUseCase: ConsultarPublicadoPersonalizadoUseCase,
    private readonly publicarUseCase: PublicarArbolPersonalizadoUseCase,
    private readonly archivarUseCase: ArchivarArbolPersonalizadoUseCase,
    private readonly auditoriaUseCase: ConsultarAuditoriaArbolUseCase,
    private readonly rechazarEliminacionUseCase: RechazarEliminacionArbolPersonalizadoUseCase,
  ) {}

  @Post()
  @UseGuards(CsrfSessionGuard)
  crear(
    @Body() dto: CrearArbolPersonalizadoDtoRequest,
    @Req() request: AuthenticatedSessionRequest,
  ): Promise<FlujoConversacionalDtoResponse> {
    return this.crearUseCase.execute(
      dto,
      request.autenticacion.usuario.id_usuario,
    );
  }

  @Get()
  @Header('Cache-Control', 'no-store')
  listar(): Promise<HistorialArbolesPersonalizadosDtoResponse> {
    return this.listarUseCase.execute();
  }

  @Get('/publicado')
  @Header('Cache-Control', 'no-store')
  consultarPublicado(
    @Query() perfil: ConsultarPerfilArbolDtoRequest,
  ): Promise<FlujoConversacionalDtoResponse | null> {
    return this.consultarPublicadoUseCase.execute(perfil);
  }

  @Get('/:id_flujo')
  @Header('Cache-Control', 'no-store')
  consultar(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
  ): Promise<ArbolConversacionalDtoResponse> {
    return this.consultarUseCase.execute(idFlujo);
  }

  @Get('/:id_flujo/auditoria')
  @Header('Cache-Control', 'no-store')
  auditoria(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
  ): Promise<AuditoriaArbolDtoResponse[]> {
    return this.auditoriaUseCase.execute(idFlujo);
  }

  @Post('/:id_flujo/nueva-version')
  @UseGuards(CsrfSessionGuard)
  clonarVersion(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
    @Req() request: AuthenticatedSessionRequest,
  ): Promise<FlujoConversacionalDtoResponse> {
    return this.clonarUseCase.execute(
      idFlujo,
      request.autenticacion.usuario.id_usuario,
    );
  }

  @Post('/:id_flujo/publicar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CsrfSessionGuard)
  publicar(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
    @Req() request: AuthenticatedSessionRequest,
  ): Promise<FlujoConversacionalDtoResponse> {
    return this.publicarUseCase.execute(
      idFlujo,
      request.autenticacion.usuario.id_usuario,
    );
  }

  @Post('/:id_flujo/archivar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CsrfSessionGuard)
  archivar(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
    @Req() request: AuthenticatedSessionRequest,
  ): Promise<FlujoConversacionalDtoResponse> {
    return this.archivarUseCase.execute(
      idFlujo,
      request.autenticacion.usuario.id_usuario,
    );
  }

  @Delete('/:id_flujo')
  @UseGuards(CsrfSessionGuard)
  eliminar(
    @Param('id_flujo', new ParseUUIDPipe()) idFlujo: string,
  ): Promise<never> {
    return this.rechazarEliminacionUseCase.execute(idFlujo);
  }
}
