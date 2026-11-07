import {
  Body,
  Controller,
  Header,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ProcesarRespuestaDtoRequest } from '../../../application/dto/procesar-respuesta.dto-request';
import { ProcesarRespuestaUseCase } from '../../../application/use-cases/sesion/procesar-respuesta.use-case';
import { CsrfSessionGuard } from '../../../../usuarios/presentation/guards/csrf-session.guard';
import { AccesoEstudiante } from '../../decorators/acceso.decorators';
import { IdUsuarioSesion } from '../../decorators/id-usuario-sesion.decorator';
import { ErrorRespuestaChatFilter } from '../../filters/error-respuesta-chat.filter';

@Controller(['/api/chat/sesiones', '/chat/sesiones'])
@AccesoEstudiante()
@UseFilters(ErrorRespuestaChatFilter)
export class RespuestasConversacionalesController {
  constructor(private readonly procesar: ProcesarRespuestaUseCase) {}

  @Post('/:idSesion/respuestas')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @UseGuards(CsrfSessionGuard)
  responder(
    @Param('idSesion', new ParseUUIDPipe()) idSesion: string,
    @IdUsuarioSesion() idUsuario: string,
    @Body() dto: ProcesarRespuestaDtoRequest,
  ) {
    return this.procesar.execute(idSesion, idUsuario, dto);
  }
}
