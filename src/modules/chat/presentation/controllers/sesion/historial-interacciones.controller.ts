import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Query,
  UseFilters,
} from '@nestjs/common';
import { ConsultarHistorialInteraccionesDtoRequest } from '../../../application/dto/historial-interacciones.dto-request';
import { HistorialInteraccionesDtoResponse } from '../../../application/dto/historial-interacciones.dto-response';
import { ConsultarHistorialInteraccionesUseCase } from '../../../application/use-cases/sesion/consultar-historial-interacciones.use-case';
import { AccesoEstudiante } from '../../decorators/acceso.decorators';
import { IdUsuarioSesion } from '../../decorators/id-usuario-sesion.decorator';
import { ErrorHistorialChatFilter } from '../../filters/error-contrato-chat.filter';

/** RF-31 / RF-32: historial reciente de la sesión (solo lectura, sin CSRF). */
@Controller('/chat/sesiones')
@AccesoEstudiante()
@UseFilters(ErrorHistorialChatFilter)
export class HistorialInteraccionesController {
  constructor(
    private readonly consultar: ConsultarHistorialInteraccionesUseCase,
  ) {}

  @Get('/:id_sesion/historial')
  @Header('Cache-Control', 'no-store')
  obtener(
    @Param('id_sesion', new ParseUUIDPipe()) idSesion: string,
    @Query() consulta: ConsultarHistorialInteraccionesDtoRequest,
    @IdUsuarioSesion() idUsuario: string,
  ): Promise<HistorialInteraccionesDtoResponse> {
    return this.consultar.execute(idSesion, idUsuario, consulta);
  }
}
