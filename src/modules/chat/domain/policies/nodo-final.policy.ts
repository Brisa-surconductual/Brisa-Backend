import { NodoConversacional } from '../entities/flujo/nodo-conversacional.entity';
import {
  NodoFinalConCapturaException,
  NodoFinalConEntradaException,
  NodoFinalConSalidasException,
  NodoInicialYFinalException,
} from '../exceptions';
import { validarCapturaPerfilNodo } from './dimension-captura-perfil';

type NodoEvaluado = Pick<
  NodoConversacional,
  'esNodoInicial' | 'esNodoFinal' | 'contenido'
>;

/**
 * RF-25: reglas del nodo final. Cierra la terapia, así que no abre el flujo,
 * no espera respuesta, no captura perfil y no tiene transiciones de salida.
 * La unicidad por flujo la garantiza el índice `uq_nodo_final_por_flujo`.
 */
export class NodoFinalPolicy {
  validar(nodo: NodoEvaluado, tieneSalidas: boolean): void {
    validarCapturaPerfilNodo(nodo.contenido);
    if (!nodo.esNodoFinal) return;
    if (nodo.esNodoInicial) throw new NodoInicialYFinalException();
    const entrada = nodo.contenido.entrada;
    if (entrada !== undefined && entrada !== null)
      throw new NodoFinalConEntradaException();
    if (validarCapturaPerfilNodo(nodo.contenido) !== null)
      throw new NodoFinalConCapturaException();
    if (tieneSalidas) throw new NodoFinalConSalidasException();
  }
}

/** Los flujos con nodo final marcado usan las reglas nuevas; los demás son legado. */
export function flujoUsaNodoFinal(
  nodos: readonly Pick<NodoConversacional, 'esNodoFinal'>[],
): boolean {
  return nodos.some((nodo) => nodo.esNodoFinal);
}

/**
 * RF-25: un nodo sin respuesta (CONTINUAR) y sin transiciones explícitas avanza
 * al siguiente nodo por `orden`. Solo aplica en flujos con nodo final, para no
 * cambiar el comportamiento de los flujos legado ya publicados.
 */
export function siguienteNodoPorOrden<
  T extends Pick<NodoConversacional, 'idNodo' | 'orden' | 'esNodoFinal'>,
>(nodos: readonly T[], nodo: T): T | null {
  if (!flujoUsaNodoFinal(nodos) || nodo.esNodoFinal || nodo.orden === null)
    return null;
  const actual = nodo.orden;
  return nodos.reduce<T | null>((mejor, candidato) => {
    if (
      candidato.idNodo === nodo.idNodo ||
      candidato.orden === null ||
      candidato.orden <= actual
    )
      return mejor;
    return mejor === null || candidato.orden < (mejor.orden as number)
      ? candidato
      : mejor;
  }, null);
}
