import {
  PresentacionNodoActualPort,
  FirmarRecursoNodoPort,
} from '../../ports/presentacion-nodo-actual.port';
import { PresentarBloquesNodoActualService } from '../../services/presentar-bloques-nodo-actual.service';
import { PresentarNodoActualService } from '../../services/presentar-nodo-actual.service';
import { PrepararEntradaNodoActualService } from '../../services/preparar-entrada-nodo-actual.service';

export function presentadorNodoPrueba(
  lecturas: PresentacionNodoActualPort = {
    consultarReglas: () => Promise.resolve([]),
    consultarRecursos: () => Promise.resolve([]),
  },
  firmar: FirmarRecursoNodoPort = {
    lectura: () =>
      Promise.reject(new Error('No debe firmar sin recurso autorizado.')),
  },
) {
  return new PresentarNodoActualService(
    lecturas,
    new PresentarBloquesNodoActualService(firmar),
    new PrepararEntradaNodoActualService(),
  );
}
