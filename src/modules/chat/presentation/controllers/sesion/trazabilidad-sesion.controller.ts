import { Controller, Get, Header, Param, ParseUUIDPipe } from '@nestjs/common';
import { TrazabilidadSesionDtoResponse } from '../../../application/dto/trazabilidad-sesion.dto-response';
import { ConsultarTrazabilidadSesionUseCase } from '../../../application/use-cases/sesion/consultar-trazabilidad-sesion.use-case';
import { AccesoAdministrativo } from '../../decorators/acceso.decorators';
import { RespuestaHttp } from '../../interceptors/respuesta-http.interceptor';

/** Auditoría de una sesión por el equipo de psicología. Solo lectura. */
@Controller('/chat/admin/sesiones')
@AccesoAdministrativo()
export class TrazabilidadSesionController {
  constructor(
    private readonly trazabilidad: ConsultarTrazabilidadSesionUseCase,
  ) {}

  @Get('/:id_sesion/trazabilidad')
  @Header('Cache-Control', 'no-store')
  @RespuestaHttp({ envolver: true })
  consultar(
    @Param('id_sesion', new ParseUUIDPipe()) idSesion: string,
  ): Promise<TrazabilidadSesionDtoResponse> {
    return this.trazabilidad.execute(idSesion);
  }
}
