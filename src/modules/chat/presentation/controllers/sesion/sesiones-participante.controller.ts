import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { ListarSesionesParticipanteDtoRequest } from '../../../application/dto/sesiones-participante.dto-request';
import { SesionesParticipanteDtoResponse } from '../../../application/dto/sesiones-participante.dto-response';
import { ListarSesionesParticipanteUseCase } from '../../../application/use-cases/sesion/listar-sesiones-participante.use-case';
import { OperacionConsultaTrazabilidad } from '../../../application/services/auditar-consulta-trazabilidad.service';
import { AccesoAdministrativoAuditado } from '../../decorators/acceso.decorators';
import { RespuestaHttp } from '../../interceptors/respuesta-http.interceptor';
import { CodigoParticipantePipe } from '../../pipes/codigo-participante.pipe';

/**
 * RF-38 (ampliación para M-8): sesiones de un participante para el equipo de
 * psicología. Solo lectura; no existe ninguna operación de escritura.
 */
@Controller('/chat/admin/participantes')
@AccesoAdministrativoAuditado(
  OperacionConsultaTrazabilidad.LISTAR_SESIONES_PARTICIPANTE,
)
export class SesionesParticipanteController {
  constructor(private readonly listar: ListarSesionesParticipanteUseCase) {}

  @Get('/:codigo_participante/sesiones')
  @Header('Cache-Control', 'no-store')
  @RespuestaHttp({ envolver: true })
  consultar(
    @Param('codigo_participante', CodigoParticipantePipe) codigo: string,
    @Query() consulta: ListarSesionesParticipanteDtoRequest,
  ): Promise<SesionesParticipanteDtoResponse> {
    return this.listar.execute(codigo, consulta);
  }
}
