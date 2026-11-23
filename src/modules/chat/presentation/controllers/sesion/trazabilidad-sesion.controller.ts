import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ConsultarTrazabilidadSesionDtoRequest } from '../../../application/dto/trazabilidad-sesion.dto-request';
import { TrazabilidadSesionDtoResponse } from '../../../application/dto/trazabilidad-sesion.dto-response';
import { ConsultarTrazabilidadSesionUseCase } from '../../../application/use-cases/sesion/consultar-trazabilidad-sesion.use-case';
import { OperacionConsultaTrazabilidad } from '../../../application/services/auditar-consulta-trazabilidad.service';
import { AccesoAdministrativoAuditado } from '../../decorators/acceso.decorators';
import { RespuestaHttp } from '../../interceptors/respuesta-http.interceptor';

/** Auditoría de una sesión por el equipo de psicología. Solo lectura. */
@Controller('/chat/admin/sesiones')
@AccesoAdministrativoAuditado(
  OperacionConsultaTrazabilidad.CONSULTAR_TRAZABILIDAD_SESION,
)
export class TrazabilidadSesionController {
  constructor(
    private readonly trazabilidad: ConsultarTrazabilidadSesionUseCase,
  ) {}

  @Get('/:id_sesion/trazabilidad')
  @Header('Cache-Control', 'no-store')
  @RespuestaHttp({ envolver: true })
  consultar(
    @Param('id_sesion', new ParseUUIDPipe()) idSesion: string,
    @Query() consulta: ConsultarTrazabilidadSesionDtoRequest,
  ): Promise<TrazabilidadSesionDtoResponse> {
    return this.trazabilidad.execute(
      idSesion,
      consulta.codigo_participante === undefined
        ? {}
        : { codigoParticipante: consulta.codigo_participante },
    );
  }
}
