import { NodoConversacional } from '../../domain/entities/flujo/nodo-conversacional.entity';
import {
  NodoDestinoNoEncontradoException,
  NodoFueraDeFlujoException,
  NodoOrigenNoEncontradoException,
} from '../../domain/exceptions';
import { ArbolConversacionalRepository } from '../../domain/repositories/arbol-conversacional.repository';

export interface NodosDeLaTransicion {
  readonly origen: NodoConversacional;
  readonly destino: NodoConversacional;
}

/** Comprueba que ambos nodos existan y pertenezcan al flujo indicado; los
 * devuelve para que el llamador no tenga que volver a consultarlos (p. ej.
 * para la compatibilidad entrada↔regla, RF-25). */
export async function verificarNodosDelFlujo(
  repository: ArbolConversacionalRepository,
  idFlujo: string,
  idNodoOrigen: string,
  idNodoDestino: string,
): Promise<NodosDeLaTransicion> {
  const [origen, destino] = await Promise.all([
    repository.buscarNodo(idNodoOrigen),
    repository.buscarNodo(idNodoDestino),
  ]);
  if (origen === null) throw new NodoOrigenNoEncontradoException();
  if (destino === null) throw new NodoDestinoNoEncontradoException();
  if (origen.idFlujo !== idFlujo || destino.idFlujo !== idFlujo) {
    throw new NodoFueraDeFlujoException();
  }
  return { origen, destino };
}
