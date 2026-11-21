import { Injectable } from '@nestjs/common';
import { ConflictoRespuestaConversacionalException } from '../../domain/exceptions/respuesta.exceptions';
import { HistorialConversacionalInconsistenteException } from '../exceptions/historial-conversacional-inconsistente.exception';
import {
  EstadoConversacionalTransaccion,
  PasoConversacional,
} from '../ports/estado-conversacional.port';

@Injectable()
export class EstadoConversacionalService {
  async registrarPaso(
    estado: EstadoConversacionalTransaccion,
    paso: PasoConversacional,
  ): Promise<void> {
    await estado.insertarPaso(paso);
    if (!(await estado.avanzarDesdeOrigen(paso)))
      throw new ConflictoRespuestaConversacionalException(
        'La conversación avanzó. Consulte el nodo actual.',
        'NODO_DESACTUALIZADO',
      );
    await estado.actualizarEstado(paso);
    if (!(await estado.validarHistorial(paso.idSesion)))
      throw new HistorialConversacionalInconsistenteException();
  }
}
