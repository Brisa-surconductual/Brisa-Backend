import { Injectable } from '@nestjs/common';
import { SesionConversacionalNoEncontradaException } from '../../../domain/exceptions/sesion.exceptions';
import { HistorialInteraccionesRepository } from '../../../domain/repositories/historial-interacciones.repository';
import { SesionConversacionalRepository } from '../../../domain/repositories/sesion-conversacional.repository';
import { TrazabilidadSesionDtoResponse } from '../../dto/trazabilidad-sesion.dto-response';
import { HistorialConversacionalInconsistenteException } from '../../exceptions/historial-conversacional-inconsistente.exception';
import { SeudonimoParticipantePort } from '../../ports/seudonimo-participante.port';
import { TrazabilidadPort } from '../../ports/trazabilidad-sesion.port';

/**
 * Auditoría del equipo de psicología: secuencia completa de una sesión. Solo
 * lee `chat` (la inmutabilidad del historial la garantiza la BD, RF-38). El
 * participante se identifica con su seudónimo (A7).
 */
@Injectable()
export class ConsultarTrazabilidadSesionUseCase implements TrazabilidadPort {
  constructor(
    private readonly sesiones: SesionConversacionalRepository,
    private readonly historial: HistorialInteraccionesRepository,
    private readonly seudonimos: SeudonimoParticipantePort,
  ) {}

  obtenerSesion(idSesion: string): Promise<TrazabilidadSesionDtoResponse> {
    return this.execute(idSesion);
  }

  async execute(idSesion: string): Promise<TrazabilidadSesionDtoResponse> {
    const id = idSesion.toLowerCase();
    const sesion = await this.sesiones.buscarPorId(id);
    if (sesion === null) throw new SesionConversacionalNoEncontradaException();

    const registros = await this.historial.consultarCompleta(id);
    if (registros === null)
      throw new HistorialConversacionalInconsistenteException();

    const idParticipante = await this.seudonimos.obtener(sesion.idUsuario);
    return TrazabilidadSesionDtoResponse.crear(id, idParticipante, registros);
  }
}
