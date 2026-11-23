import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { IntervencionSosPort } from '../../application/ports/intervencion-sos.port';

/** Horas que se conserva el contexto de origen tras el cierre (Ley 1581). */
const HORAS_CONTEXTO_SOS = 24;

/**
 * RF-43: cierra como EXPIRADA las intervenciones abandonadas, para que el
 * evento CHAT_SOS_ACTIVADO llegue a M05 aunque el cliente nunca finalice, y
 * borra el contexto de origen 24 h después del cierre.
 */
@Injectable()
export class ExpirarIntervencionesSosCron {
  private readonly logger = new Logger(ExpirarIntervencionesSosCron.name);
  private enCurso = false;

  constructor(private readonly sos: IntervencionSosPort) {}

  @Interval('expirar-intervenciones-sos', 15_000)
  async expirar(): Promise<void> {
    if (this.enCurso) return;
    this.enCurso = true;
    try {
      await this.sos.expirarVencidas(100);
    } catch {
      this.logger.warn('No fue posible expirar intervenciones SOS.');
    } finally {
      this.enCurso = false;
    }
  }

  @Interval('purgar-contexto-sos', 10 * 60_000)
  async purgarContextos(): Promise<void> {
    try {
      await this.sos.purgarContextos(HORAS_CONTEXTO_SOS);
    } catch {
      this.logger.warn('No fue posible purgar el contexto de origen SOS.');
    }
  }
}
