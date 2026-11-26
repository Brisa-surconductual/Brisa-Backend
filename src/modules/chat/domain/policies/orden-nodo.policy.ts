import { NodoConversacional } from '../entities/flujo/nodo-conversacional.entity';
import {
  OrdenNodoConSaltoException,
  OrdenNodoDuplicadoException,
  OrdenNodoInicialInvalidoException,
} from '../exceptions';

/**
 * Reglas de `orden` dentro de un flujo: el nodo inicial siempre es 1, y un
 * nodo nuevo o editado no puede duplicar el orden de otro ni saltarse el
 * siguiente disponible. Un nodo sin orden (null) queda fuera de esta regla.
 */
export class OrdenNodoPolicy {
  validar(
    hermanos: readonly NodoConversacional[],
    idNodoPropio: string | null,
    orden: number | null,
    esNodoInicial: boolean,
  ): void {
    if (esNodoInicial && orden !== 1) {
      throw new OrdenNodoInicialInvalidoException();
    }

    if (orden === null) return;

    const ordenesOtros = hermanos
      .filter((nodo) => nodo.idNodo !== idNodoPropio)
      .map((nodo) => nodo.orden)
      .filter((valor): valor is number => valor !== null);

    if (ordenesOtros.includes(orden)) {
      throw new OrdenNodoDuplicadoException(orden);
    }

    const maximoActual =
      ordenesOtros.length > 0 ? Math.max(...ordenesOtros) : 0;
    if (orden > maximoActual + 1) {
      throw new OrdenNodoConSaltoException(maximoActual + 1, orden);
    }
  }
}
