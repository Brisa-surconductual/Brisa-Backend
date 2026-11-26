import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
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
import { GestionarMensajesNotificacionUseCase } from '../../application/use-cases/gestionar-mensajes-notificacion.use-case';
import type {
  ActualizarTerminosRestringidos,
  ConsultaMensajesNotificacion,
  CrearMensajeNotificacion,
  EditarMensajeNotificacion,
} from '../../domain/results/mensajes-notificacion';
import {
  ActualizarTerminosRestringidosDto,
  ConsultaMensajesNotificacionDto,
  CrearMensajeNotificacionDto,
  EditarMensajeNotificacionDto,
} from '../dto/mensajes-notificacion.dto';
import { contextoGestionContenido } from '../http/contexto-gestion-contenido';
import {
  AccionSinCuerpoDto,
  validarGestionContenido,
} from '../http/validar-gestion-contenido';

@Controller('admin/notificaciones')
@Roles(Rol.ADMINISTRATIVO, Rol.COORDINADOR_PSI)
@AlcancesSesion(AlcanceSesion.COMPLETA)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
export class MensajesNotificacionController {
  constructor(
    private readonly mensajes: GestionarMensajesNotificacionUseCase,
  ) {}

  @Get('mensajes')
  @Header('Cache-Control', 'no-store')
  listar(
    @Query(
      validarGestionContenido(
        ConsultaMensajesNotificacionDto,
        'PARAMETRO_INVALIDO',
      ),
    )
    consulta: ConsultaMensajesNotificacion,
  ) {
    return this.mensajes.listar(consulta);
  }

  @Post('mensajes')
  @UseGuards(CsrfSessionGuard)
  crear(
    @Req() req: AuthenticatedSessionRequest,
    @Body(
      validarGestionContenido(
        CrearMensajeNotificacionDto,
        'MENSAJE_INCOMPLETO',
      ),
    )
    entrada: CrearMensajeNotificacion,
  ) {
    return this.mensajes.crear(contextoGestionContenido(req), entrada);
  }

  @Patch('mensajes/:id_mensaje')
  @UseGuards(CsrfSessionGuard)
  editar(
    @Req() req: AuthenticatedSessionRequest,
    @Param('id_mensaje', ParseUUIDPipe) id: string,
    @Body(
      validarGestionContenido(
        EditarMensajeNotificacionDto,
        'MENSAJE_INCOMPLETO',
      ),
    )
    entrada: EditarMensajeNotificacion,
  ) {
    return this.mensajes.editar(contextoGestionContenido(req), id, entrada);
  }

  @Post('mensajes/:id_mensaje/activar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CsrfSessionGuard)
  activar(
    @Body(validarGestionContenido(AccionSinCuerpoDto, 'PARAMETRO_INVALIDO'))
    _cuerpo: unknown,
    @Req() req: AuthenticatedSessionRequest,
    @Param('id_mensaje', ParseUUIDPipe) id: string,
  ) {
    return this.mensajes.activar(contextoGestionContenido(req), id);
  }

  @Post('mensajes/:id_mensaje/inactivar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CsrfSessionGuard)
  inactivar(
    @Body(validarGestionContenido(AccionSinCuerpoDto, 'PARAMETRO_INVALIDO'))
    _cuerpo: unknown,
    @Req() req: AuthenticatedSessionRequest,
    @Param('id_mensaje', ParseUUIDPipe) id: string,
  ) {
    return this.mensajes.inactivar(contextoGestionContenido(req), id);
  }

  @Get('terminos-restringidos')
  @Header('Cache-Control', 'no-store')
  obtenerTerminos() {
    return this.mensajes.obtenerTerminos();
  }

  @Put('terminos-restringidos')
  @UseGuards(CsrfSessionGuard)
  actualizarTerminos(
    @Req() req: AuthenticatedSessionRequest,
    @Body(
      validarGestionContenido(
        ActualizarTerminosRestringidosDto,
        'LISTA_TERMINOS_INVALIDA',
      ),
    )
    entrada: ActualizarTerminosRestringidos,
  ) {
    return this.mensajes.actualizarTerminos(
      contextoGestionContenido(req),
      entrada,
    );
  }
}
