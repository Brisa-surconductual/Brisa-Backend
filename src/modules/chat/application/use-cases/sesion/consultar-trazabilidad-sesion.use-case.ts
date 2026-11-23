import { Injectable } from '@nestjs/common';
import { SesionConversacionalNoEncontradaException } from '../../../domain/exceptions/sesion.exceptions';
import { HistorialInteraccionesRepository } from '../../../domain/repositories/historial-interacciones.repository';
import { SesionConversacionalRepository } from '../../../domain/repositories/sesion-conversacional.repository';
import { TrazabilidadSesionDtoResponse } from '../../dto/trazabilidad-sesion.dto-response';
import { HistorialConversacionalInconsistenteException } from '../../exceptions/historial-conversacional-inconsistente.exception';
import { SeudonimoParticipantePort } from '../../ports/seudonimo-participante.port';
import { TrazabilidadPort } from '../../ports/trazabilidad-sesion.port';
import { DescribirContenidoHistoricoService } from '../../services/describir-contenido-historico.service';

export interface OpcionesTrazabilidadSesion {
  /**
   * Seudónimo A7 esperado (ya normalizado). Si la sesión no es de ese
   * participante, se responde como si no existiera (404).
   */
  codigoParticipante?: string;
}

/**
 * Auditoría del equipo de psicología: secuencia completa de una sesión. Solo
 * lee (la inmutabilidad del historial la garantiza la BD, RF-38). El
 * participante se identifica con su seudónimo (A7). Cada registro añade el
 * contenido presentado cuando es históricamente verificable
 * (DescribirContenidoHistoricoService).
 */
@Injectable()
export class ConsultarTrazabilidadSesionUseCase implements TrazabilidadPort {
  constructor(
    private readonly sesiones: SesionConversacionalRepository,
    private readonly historial: HistorialInteraccionesRepository,
    private readonly seudonimos: SeudonimoParticipantePort,
    private readonly contenidoHistorico: DescribirContenidoHistoricoService,
  ) {}

  obtenerSesion(idSesion: string): Promise<TrazabilidadSesionDtoResponse> {
    return this.execute(idSesion);
  }

  async execute(
    idSesion: string,
    opciones: OpcionesTrazabilidadSesion = {},
  ): Promise<TrazabilidadSesionDtoResponse> {
    const id = idSesion.toLowerCase();
    const sesion = await this.sesiones.buscarPorId(id);
    if (sesion === null) throw new SesionConversacionalNoEncontradaException();

    if (opciones.codigoParticipante !== undefined) {
      const dueno = await this.seudonimos.resolver(opciones.codigoParticipante);
      if (dueno !== sesion.idUsuario)
        throw new SesionConversacionalNoEncontradaException();
    }

    const registros = await this.historial.consultarCompleta(id);
    if (registros === null)
      throw new HistorialConversacionalInconsistenteException();

    const descripciones = await this.contenidoHistorico.describir(
      sesion,
      registros,
    );
    const idParticipante = await this.seudonimos.obtener(sesion.idUsuario);
    return TrazabilidadSesionDtoResponse.crear(
      id,
      idParticipante,
      registros,
      descripciones,
    );
  }
}
