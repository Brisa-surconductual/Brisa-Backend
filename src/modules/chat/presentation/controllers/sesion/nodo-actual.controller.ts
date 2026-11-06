import { Controller, Get, Header, Param, ParseUUIDPipe } from '@nestjs/common';
import { ConsultaNodoActualDtoResponse } from '../../../application/dto/sesion-conversacional.dto-response';
import { ConsultarNodoActualUseCase } from '../../../application/use-cases/sesion/consultar-nodo-actual.use-case';
import { AccesoEstudiante } from '../../decorators/acceso.decorators';
import { IdUsuarioSesion } from '../../decorators/id-usuario-sesion.decorator';
import { RespuestaHttp } from '../../interceptors/respuesta-http.interceptor';

@Controller('/chat/sesiones')
@AccesoEstudiante()
export class NodoActualController {
  constructor(private readonly consultar: ConsultarNodoActualUseCase) {}

  @Get('/:id_sesion/nodo-actual')
  @Header('Cache-Control', 'no-store')
  @RespuestaHttp({ envolver: true })
  obtener(
    @Param('id_sesion', new ParseUUIDPipe()) idSesion: string,
    @IdUsuarioSesion() idUsuario: string,
  ): Promise<ConsultaNodoActualDtoResponse> {
    return this.consultar.execute(idSesion, idUsuario);
  }
}
