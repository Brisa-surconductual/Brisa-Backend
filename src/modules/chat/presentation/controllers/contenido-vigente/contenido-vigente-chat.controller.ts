import {
  Controller,
  Get,
  Header,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ConsultarContenidoVigenteChatDtoRequest } from '../../../application/dto/contenido-vigente-chat.dto-request';
import { ContenidoVigenteChatDtoResponse } from '../../../application/dto/contenido-vigente-chat.dto-response';
import { ConsultarMiContenidoVigenteUseCase } from '../../../application/use-cases/contenido-vigente/consultar-mi-contenido-vigente.use-case';
import { AccesoEstudiante } from '../../decorators/acceso.decorators';
import { IdUsuarioSesion } from '../../decorators/id-usuario-sesion.decorator';
import { SinContenidoInterceptor } from '../../interceptors/estado-http.interceptors';

/** Contenidos del cronograma vigentes para el estudiante autenticado. */
@Controller('/chat/me')
@AccesoEstudiante()
export class ContenidoVigenteChatController {
  constructor(
    private readonly consultarContenido: ConsultarMiContenidoVigenteUseCase,
  ) {}

  @Get('/contenidos-vigentes')
  @Header('Cache-Control', 'no-store')
  @UseInterceptors(SinContenidoInterceptor)
  consultar(
    @Query() _consulta: ConsultarContenidoVigenteChatDtoRequest,
    @IdUsuarioSesion() idUsuario: string,
  ): Promise<ContenidoVigenteChatDtoResponse[]> {
    return this.consultarContenido.execute(idUsuario);
  }
}
