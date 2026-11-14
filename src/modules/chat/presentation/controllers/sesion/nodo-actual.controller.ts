import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  UseFilters,
} from '@nestjs/common';
import { PresentacionNodoActualDtoResponse } from '../../../application/dto/presentacion-nodo-actual.dto-response';
import { ConsultarNodoActualUseCase } from '../../../application/use-cases/sesion/consultar-nodo-actual.use-case';
import { AccesoEstudiante } from '../../decorators/acceso.decorators';
import { IdUsuarioSesion } from '../../decorators/id-usuario-sesion.decorator';
import { ErrorContratoChatFilter } from '../../filters/error-contrato-chat.filter';

@Controller( '/chat/sesiones')
@AccesoEstudiante()
@UseFilters(ErrorContratoChatFilter)
export class NodoActualController {
  constructor(private readonly consultar: ConsultarNodoActualUseCase) {}

  @Get('/:idSesion/nodo-actual')
  @Header('Cache-Control', 'no-store')
  obtener(
    @Param('idSesion', new ParseUUIDPipe()) idSesion: string,
    @IdUsuarioSesion() idUsuario: string,
  ): Promise<PresentacionNodoActualDtoResponse> {
    return this.consultar.execute(idSesion, idUsuario);
  }
}
