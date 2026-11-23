import { Injectable } from '@nestjs/common';
import { IntervencionSos } from '../../../domain/entities/sos/intervencion-sos.entity';
import { MotivoFinalizacionSos } from '../../../domain/enums/intervencion-sos.enum';
import {
  IntervencionSosFinalizadaException,
  IntervencionSosNoEncontradaException,
} from '../../../domain/exceptions';
import { SesionConversacionalRepository } from '../../../domain/repositories/sesion-conversacional.repository';
import { FinalizarSosDtoResponse } from '../../dto/sos/sos.dto-response';
import { IntervencionSosPort } from '../../ports/intervencion-sos.port';

/**
 * RF-43: cierra la intervención con la duración medida por el servidor y
 * escribe CHAT_SOS_ACTIVADO en el outbox de RF-39 en la misma transacción.
 * Devuelve la sesión pausada para retomarla con POST /chat/sesiones/iniciar.
 */
@Injectable()
export class FinalizarIntervencionSosUseCase {
  constructor(
    private readonly sos: IntervencionSosPort,
    private readonly sesiones: SesionConversacionalRepository,
  ) {}

  async execute(
    idIntervencion: string,
    idUsuario: string,
    motivo: MotivoFinalizacionSos,
  ): Promise<FinalizarSosDtoResponse> {
    const cerrada = await this.sos.ejecutar(async (tx) => {
      const actual = await tx.bloquear(idIntervencion, idUsuario);
      if (actual === null) throw new IntervencionSosNoEncontradaException();
      if (!actual.estaEnCurso) throw new IntervencionSosFinalizadaException();
      await tx.cerrar(
        actual.idIntervencion,
        IntervencionSos.estadoPorMotivo(motivo),
      );
      const resultado = await tx.bloquear(idIntervencion, idUsuario);
      if (resultado === null) throw new IntervencionSosNoEncontradaException();
      return resultado;
    });

    const pausada =
      cerrada.idSesionPausada === null
        ? null
        : await this.sesiones.buscarPorIdYUsuario(
            cerrada.idSesionPausada,
            idUsuario,
          );
    return FinalizarSosDtoResponse.crear(
      cerrada,
      pausada === null
        ? null
        : { idSesion: pausada.idSesion, idNodoActual: pausada.idNodoActual },
    );
  }
}
