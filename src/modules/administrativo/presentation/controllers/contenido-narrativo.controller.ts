import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../../shared/presentation/guards/role-guard';
import { AlcanceSesion } from '../../../usuarios/domain/enums/alcance-sesion.enum';
import { Rol } from '../../../usuarios/domain/enums/rol.enum';
import { AlcancesSesion } from '../../../usuarios/presentation/decorators/alcances-sesion.decorator';
import { CsrfSessionGuard } from '../../../usuarios/presentation/guards/csrf-session.guard';
import { SessionAuthGuard } from '../../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../../usuarios/presentation/guards/session-scope.guard';
import type { AuthenticatedSessionRequest } from '../../../usuarios/presentation/http/authenticated-session-request';
import { GestionContenidoException } from '../../application/exceptions/gestion-contenido.exception';
import { GestionarContenidoNarrativoUseCase } from '../../application/use-cases/gestionar-contenido-narrativo.use-case';
import type {
  CrearCapituloNarrativo,
  CrearLogroNarrativo,
  EditarCapituloNarrativo,
  EditarLogroNarrativo,
  GuardarReglaNivel,
} from '../../domain/results/contenido-narrativo';
import {
  CrearCapituloNarrativoDto,
  CrearLogroNarrativoDto,
  EditarCapituloNarrativoDto,
  EditarLogroNarrativoDto,
  GuardarReglaNivelDto,
} from '../dto/contenido-narrativo.dto';
import { contextoGestionContenido } from '../http/contexto-gestion-contenido';
import {
  AccionSinCuerpoDto,
  validarGestionContenido,
} from '../http/validar-gestion-contenido';

const validarNivel = new ParseIntPipe({
  exceptionFactory: () =>
    new GestionContenidoException('REGLA_NIVEL_INCOMPLETA'),
});

@Controller('admin/narrativa')
@Roles(Rol.ADMINISTRATIVO, Rol.COORDINADOR_PSI)
@AlcancesSesion(AlcanceSesion.COMPLETA)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
export class ContenidoNarrativoController {
  constructor(private readonly contenido: GestionarContenidoNarrativoUseCase) {}

  @Get('capitulos')
  @Header('Cache-Control', 'no-store')
  listarCapitulos() {
    return this.contenido.listarCapitulos();
  }

  @Post('capitulos')
  @UseGuards(CsrfSessionGuard)
  crearCapitulo(
    @Req() req: AuthenticatedSessionRequest,
    @Body(
      validarGestionContenido(CrearCapituloNarrativoDto, 'CAPITULO_INCOMPLETO'),
    )
    entrada: CrearCapituloNarrativo,
  ) {
    return this.contenido.crearCapitulo(contextoGestionContenido(req), entrada);
  }

  @Patch('capitulos/:id_capitulo')
  @UseGuards(CsrfSessionGuard)
  editarCapitulo(
    @Req() req: AuthenticatedSessionRequest,
    @Param('id_capitulo', ParseUUIDPipe) id: string,
    @Body(
      validarGestionContenido(
        EditarCapituloNarrativoDto,
        'CAPITULO_INCOMPLETO',
      ),
    )
    entrada: EditarCapituloNarrativo,
  ) {
    return this.contenido.editarCapitulo(
      contextoGestionContenido(req),
      id,
      entrada,
    );
  }

  @Post('capitulos/:id_capitulo/publicar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CsrfSessionGuard)
  publicarCapitulo(
    @Body(validarGestionContenido(AccionSinCuerpoDto, 'PARAMETRO_INVALIDO'))
    _cuerpo: unknown,
    @Req() req: AuthenticatedSessionRequest,
    @Param('id_capitulo', ParseUUIDPipe) id: string,
  ) {
    return this.contenido.publicarCapitulo(contextoGestionContenido(req), id);
  }

  @Post('capitulos/:id_capitulo/inactivar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CsrfSessionGuard)
  inactivarCapitulo(
    @Body(validarGestionContenido(AccionSinCuerpoDto, 'PARAMETRO_INVALIDO'))
    _cuerpo: unknown,
    @Req() req: AuthenticatedSessionRequest,
    @Param('id_capitulo', ParseUUIDPipe) id: string,
  ) {
    return this.contenido.inactivarCapitulo(contextoGestionContenido(req), id);
  }

  @Get('logros')
  @Header('Cache-Control', 'no-store')
  listarLogros() {
    return this.contenido.listarLogros();
  }

  @Post('logros')
  @UseGuards(CsrfSessionGuard)
  crearLogro(
    @Req() req: AuthenticatedSessionRequest,
    @Body(validarGestionContenido(CrearLogroNarrativoDto, 'LOGRO_INCOMPLETO'))
    entrada: CrearLogroNarrativo,
  ) {
    return this.contenido.crearLogro(contextoGestionContenido(req), entrada);
  }

  @Patch('logros/:id_logro')
  @UseGuards(CsrfSessionGuard)
  editarLogro(
    @Req() req: AuthenticatedSessionRequest,
    @Param('id_logro', ParseUUIDPipe) id: string,
    @Body(validarGestionContenido(EditarLogroNarrativoDto, 'LOGRO_INCOMPLETO'))
    entrada: EditarLogroNarrativo,
  ) {
    return this.contenido.editarLogro(
      contextoGestionContenido(req),
      id,
      entrada,
    );
  }

  @Post('logros/:id_logro/activar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CsrfSessionGuard)
  activarLogro(
    @Body(validarGestionContenido(AccionSinCuerpoDto, 'PARAMETRO_INVALIDO'))
    _cuerpo: unknown,
    @Req() req: AuthenticatedSessionRequest,
    @Param('id_logro', ParseUUIDPipe) id: string,
  ) {
    return this.contenido.activarLogro(contextoGestionContenido(req), id);
  }

  @Post('logros/:id_logro/inactivar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CsrfSessionGuard)
  inactivarLogro(
    @Body(validarGestionContenido(AccionSinCuerpoDto, 'PARAMETRO_INVALIDO'))
    _cuerpo: unknown,
    @Req() req: AuthenticatedSessionRequest,
    @Param('id_logro', ParseUUIDPipe) id: string,
  ) {
    return this.contenido.inactivarLogro(contextoGestionContenido(req), id);
  }

  @Put('reglas-nivel/:nivel_gamificacion')
  @UseGuards(CsrfSessionGuard)
  guardarRegla(
    @Req() req: AuthenticatedSessionRequest,
    @Param('nivel_gamificacion', validarNivel) nivel: number,
    @Body(
      validarGestionContenido(GuardarReglaNivelDto, 'REGLA_NIVEL_INCOMPLETA'),
    )
    entrada: GuardarReglaNivel,
  ) {
    if (!Number.isSafeInteger(nivel) || nivel < 1) {
      throw new GestionContenidoException('REGLA_NIVEL_INCOMPLETA');
    }
    return this.contenido.guardarRegla(
      contextoGestionContenido(req),
      nivel,
      entrada,
    );
  }

  @Get('cobertura')
  @Header('Cache-Control', 'no-store')
  consultarCobertura() {
    return this.contenido.consultarCobertura();
  }
}
