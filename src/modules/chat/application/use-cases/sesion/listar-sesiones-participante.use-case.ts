import { Injectable } from '@nestjs/common';
import { ParticipanteNoEncontradoException } from '../../../domain/exceptions/sesion.exceptions';
import { SesionConversacionalRepository } from '../../../domain/repositories/sesion-conversacional.repository';
import { ListarSesionesParticipanteDtoRequest } from '../../dto/sesiones-participante.dto-request';
import { SesionesParticipanteDtoResponse } from '../../dto/sesiones-participante.dto-response';
import { CursorSesionesInvalidoException } from '../../exceptions/cursor-sesiones-invalido.exception';
import { SeudonimoParticipantePort } from '../../ports/seudonimo-participante.port';
import {
  codificarCursorSesiones,
  decodificarCursorSesiones,
} from '../../services/cursor-sesiones-participante';

/**
 * RF-38 (ampliación para M-8): sesiones conversacionales de un participante,
 * identificado por su seudónimo A7. Solo lectura; no crea seudónimos.
 */
@Injectable()
export class ListarSesionesParticipanteUseCase {
  constructor(
    private readonly sesiones: SesionConversacionalRepository,
    private readonly seudonimos: SeudonimoParticipantePort,
  ) {}

  /** `codigoParticipante` ya viene validado y normalizado (A7). */
  async execute(
    codigoParticipante: string,
    consulta: ListarSesionesParticipanteDtoRequest,
  ): Promise<SesionesParticipanteDtoResponse> {
    const despuesDe =
      consulta.cursor === undefined
        ? null
        : decodificarCursorSesiones(consulta.cursor);
    if (consulta.cursor !== undefined && despuesDe === null)
      throw new CursorSesionesInvalidoException();

    const idUsuario = await this.seudonimos.resolver(codigoParticipante);
    if (idUsuario === null) throw new ParticipanteNoEncontradoException();

    const pagina = await this.sesiones.listarPorUsuario(
      idUsuario,
      consulta.limite,
      despuesDe,
    );
    // Aislamiento: nunca se entrega una sesión de otro participante.
    if (pagina.sesiones.some((sesion) => sesion.idUsuario !== idUsuario))
      throw new Error('El listado incluye sesiones de otro participante.');

    const ultima = pagina.sesiones.at(-1);
    const siguienteCursor =
      pagina.hayMas && ultima !== undefined
        ? codificarCursorSesiones({
            fechaUltimaInteraccion: ultima.marcaOrden,
            idSesion: ultima.idSesion,
          })
        : null;
    return SesionesParticipanteDtoResponse.crear(
      codigoParticipante,
      pagina,
      siguienteCursor,
    );
  }
}
