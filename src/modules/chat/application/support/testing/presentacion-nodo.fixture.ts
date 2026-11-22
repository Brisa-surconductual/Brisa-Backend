import {
  PresentacionNodoActualPort,
  FirmarRecursoNodoPort,
} from '../../ports/presentacion-nodo-actual.port';
import { PresentarBloquesNodoActualService } from '../../services/presentar-bloques-nodo-actual.service';
import { PresentarNodoActualService } from '../../services/presentar-nodo-actual.service';
import { PrepararEntradaNodoActualService } from '../../services/preparar-entrada-nodo-actual.service';
import { HabilitacionNodoService } from '../../services/habilitacion-nodo.service';
import {
  HabilitacionContenidoChat,
  HabilitacionContenidoChatRepository,
} from '../../../domain/repositories/habilitacion-contenido-chat.repository';

/** Cronograma de prueba: por defecto todo contenido ya está habilitado. */
export function habilitacionPrueba(
  respuesta: HabilitacionContenidoChat = {
    habilitado: true,
    fechaHabilitacion: null,
  },
): HabilitacionNodoService {
  const repositorio: HabilitacionContenidoChatRepository = {
    consultar: () => Promise.resolve(respuesta),
  };
  return new HabilitacionNodoService(repositorio);
}

export function presentadorNodoPrueba(
  lecturas: PresentacionNodoActualPort = {
    esTerminal: () => Promise.resolve(true),
    consultarRecursos: () => Promise.resolve([]),
  },
  firmar: FirmarRecursoNodoPort = {
    lectura: () =>
      Promise.reject(new Error('No debe firmar sin recurso autorizado.')),
  },
  habilitacion: HabilitacionNodoService = habilitacionPrueba(),
) {
  return new PresentarNodoActualService(
    lecturas,
    new PresentarBloquesNodoActualService(firmar),
    new PrepararEntradaNodoActualService(),
    habilitacion,
  );
}
