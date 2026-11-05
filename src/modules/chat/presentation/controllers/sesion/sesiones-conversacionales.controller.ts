import {
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CsrfSessionGuard } from '../../../../usuarios/presentation/guards/csrf-session.guard';
import { InicioSesionConversacionalDtoResponse } from '../../../application/dto/sesion-conversacional.dto-response';
import { IniciarOReanudarSesionUseCase } from '../../../application/use-cases/sesion/iniciar-o-reanudar-sesion.use-case';
import { AccesoEstudiante } from '../../decorators/acceso.decorators';
import { IdUsuarioSesion } from '../../decorators/id-usuario-sesion.decorator';
import { EstadoSesionIniciadaInterceptor } from '../../interceptors/estado-http.interceptors';
import { RespuestaHttp } from '../../interceptors/respuesta-http.interceptor';

/** RF-24: inicio o reanudación de la sesión conversacional del estudiante. */
@Controller('/chat/sesiones')
@AccesoEstudiante()
export class SesionesConversacionalesController {
  constructor(
    private readonly iniciarOReanudar: IniciarOReanudarSesionUseCase,
  ) {}

  @Post('/iniciar')
  @HttpCode(HttpStatus.CREATED)
  @Header('Cache-Control', 'no-store')
  @UseGuards(CsrfSessionGuard)
  @UseInterceptors(EstadoSesionIniciadaInterceptor)
  @RespuestaHttp({ envolver: true })
  iniciar(
    @IdUsuarioSesion() idUsuario: string,
  ): Promise<InicioSesionConversacionalDtoResponse> {
    return this.iniciarOReanudar.execute(idUsuario);
  }
}
