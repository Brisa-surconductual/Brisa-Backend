import {
  Body,
  Controller,
  Header,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CsrfSessionGuard } from '../../../../usuarios/presentation/guards/csrf-session.guard';
import { ActivarSosDtoRequest } from '../../../application/dto/sos/activar-sos.dto-request';
import { FinalizarSosDtoRequest } from '../../../application/dto/sos/finalizar-sos.dto-request';
import {
  ActivarSosDtoResponse,
  FinalizarSosDtoResponse,
} from '../../../application/dto/sos/sos.dto-response';
import { ActivarSosUseCase } from '../../../application/use-cases/sos/activar-sos.use-case';
import { FinalizarIntervencionSosUseCase } from '../../../application/use-cases/sos/finalizar-intervencion-sos.use-case';
import { AccesoEstudiante } from '../../decorators/acceso.decorators';
import { IdUsuarioSesion } from '../../decorators/id-usuario-sesion.decorator';
import { RespuestaHttp } from '../../interceptors/respuesta-http.interceptor';

/**
 * RF-43: botón "Tengo ganas de vapear". Las respuestas del sub-árbol van por
 * POST /chat/sesiones/{id_sesion_sos}/respuestas (RF-30) y la sesión pausada
 * se retoma con POST /chat/sesiones/iniciar (RF-32).
 */
@Controller('/chat/sos')
@AccesoEstudiante()
export class SosController {
  constructor(
    private readonly activarSos: ActivarSosUseCase,
    private readonly finalizarSos: FinalizarIntervencionSosUseCase,
  ) {}

  @Post('/activar')
  @HttpCode(201)
  @Header('Cache-Control', 'no-store')
  @UseGuards(CsrfSessionGuard)
  @RespuestaHttp({ envolver: true })
  activar(
    @IdUsuarioSesion() idUsuario: string,
    @Body() dto: ActivarSosDtoRequest,
  ): Promise<ActivarSosDtoResponse> {
    return this.activarSos.execute(idUsuario, dto);
  }

  @Post('/:id_intervencion/finalizar')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @UseGuards(CsrfSessionGuard)
  @RespuestaHttp({ envolver: true })
  finalizar(
    @Param('id_intervencion', new ParseUUIDPipe()) idIntervencion: string,
    @IdUsuarioSesion() idUsuario: string,
    @Body() dto: FinalizarSosDtoRequest,
  ): Promise<FinalizarSosDtoResponse> {
    return this.finalizarSos.execute(idIntervencion, idUsuario, dto.motivo);
  }
}
