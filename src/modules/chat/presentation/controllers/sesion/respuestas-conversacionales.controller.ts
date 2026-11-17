import {
  Body,
  Controller,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ProcesarRespuestaDtoRequest } from '../../../application/dto/procesar-respuesta.dto-request';
import { ProcesarRespuestaUseCase } from '../../../application/use-cases/sesion/procesar-respuesta.use-case';
import { CsrfSessionGuard } from '../../../../usuarios/presentation/guards/csrf-session.guard';
import { AccesoEstudiante } from '../../decorators/acceso.decorators';
import { IdUsuarioSesion } from '../../decorators/id-usuario-sesion.decorator';
import { ErrorRespuestaChatFilter } from '../../filters/error-respuesta-chat.filter';
import { ValidarInteraccionPipe } from '../../pipes/validar-interaccion.pipe';

@Controller('/chat/sesiones')
@AccesoEstudiante()
@UseFilters(ErrorRespuestaChatFilter)
export class RespuestasConversacionalesController {
  constructor(private readonly procesar: ProcesarRespuestaUseCase) {}

  @Post('/:id_sesion/respuestas')
  @Header('Cache-Control', 'no-store')
  @UseGuards(CsrfSessionGuard)
  async responder(
    @Param('id_sesion', new ParseUUIDPipe()) idSesion: string,
    @IdUsuarioSesion() idUsuario: string,
    @Body(ValidarInteraccionPipe) dto: unknown,
    @Res() respuesta: Response,
  ): Promise<void> {
    const data = await this.procesar.execute(
      idSesion,
      idUsuario,
      dto as ProcesarRespuestaDtoRequest,
    );
    respuesta.status(data.duplicada ? 200 : 201).json({ data });
  }
}
