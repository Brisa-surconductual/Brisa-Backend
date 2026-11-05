import {
  NodoDestinoNoEncontradoException,
  NodoFueraDeFlujoException,
  NodoOrigenNoEncontradoException,
} from '../../domain/exceptions';
import { ArbolConversacionalRepository } from '../../domain/repositories/arbol-conversacional.repository';

/** Comprueba que ambos nodos existan y pertenezcan al flujo indicado. */
export async function verificarNodosDelFlujo(
  repository: ArbolConversacionalRepository,
  idFlujo: string,
  idNodoOrigen: string,
  idNodoDestino: string,
): Promise<void> {
  const [origen, destino] = await Promise.all([
    repository.buscarNodo(idNodoOrigen),
    repository.buscarNodo(idNodoDestino),
  ]);
  if (origen === null) throw new NodoOrigenNoEncontradoException();
  if (destino === null) throw new NodoDestinoNoEncontradoException();
  if (origen.idFlujo !== idFlujo || destino.idFlujo !== idFlujo) {
    throw new NodoFueraDeFlujoException();
  }
}
