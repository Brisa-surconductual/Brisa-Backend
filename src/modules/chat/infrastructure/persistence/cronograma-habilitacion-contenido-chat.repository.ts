import { Injectable } from '@nestjs/common';
import { ConsultaHabilitacionContenidoPort } from '../../../cronograma/application/ports/consulta-habilitacion-contenido.port';
import {
  HabilitacionContenidoChat,
  HabilitacionContenidoChatRepository,
} from '../../domain/repositories/habilitacion-contenido-chat.repository';

/** Pregunta al cronograma (M04), dueño de las fechas, si el contenido ya empezó. */
@Injectable()
export class CronogramaHabilitacionContenidoChatRepository extends HabilitacionContenidoChatRepository {
  constructor(private readonly cronograma: ConsultaHabilitacionContenidoPort) {
    super();
  }

  consultar(
    idUsuario: string,
    idContenido: string,
  ): Promise<HabilitacionContenidoChat> {
    return this.cronograma.consultar(idUsuario, idContenido);
  }
}
