import {
  ArbolConversacional,
  esTransicionPorDefecto,
} from '../../domain/entities/flujo/arbol-conversacional.entity';
import { TransicionConversacional } from '../../domain/entities/flujo/transicion-conversacional.entity';
import {
  DestinoIgualAlPorDefectoException,
  OrdenTransicionDuplicadoException,
} from '../../domain/exceptions';

/**
 * RF-25: aplica cambios a las transiciones de un origen y devuelve el árbol
 * resultante junto con todo lo que hay que guardar. Garantiza:
 * - orden de evaluación único entre las transiciones específicas;
 * - a lo sumo una transición "cualquier otra respuesta" (SIEMPRE);
 * - la transición SIEMPRE siempre queda última (se reubica sola);
 * - ninguna transición específica va al mismo destino que la SIEMPRE;
 * - el grafo sigue sin ciclos.
 */
export function reorganizarTransicionesOrigen(
  arbol: ArbolConversacional,
  idNodoOrigen: string,
  cambios: TransicionConversacional[],
): { arbol: ArbolConversacional; aGuardar: TransicionConversacional[] } {
  const aGuardar = new Map<string, TransicionConversacional>();
  let resultado = arbol;
  for (const transicion of cambios) {
    resultado = resultado.conTransicion(transicion);
    aGuardar.set(transicion.idTransicion, transicion);
  }

  const especificas = resultado
    .transicionesDeOrigen(idNodoOrigen)
    .filter((t) => !esTransicionPorDefecto(t));
  const ordenes = new Set<number>();
  for (const t of especificas) {
    if (ordenes.has(t.ordenEvaluacion))
      throw new OrdenTransicionDuplicadoException();
    ordenes.add(t.ordenEvaluacion);
  }

  resultado.validarTransicionPorDefectoUnica(idNodoOrigen);
  const porDefecto = resultado.transicionPorDefecto(idNodoOrigen);
  if (
    porDefecto !== null &&
    especificas.some((t) => t.idNodoDestino === porDefecto.idNodoDestino)
  )
    throw new DestinoIgualAlPorDefectoException();
  const reubicada = resultado.reubicarTransicionPorDefecto(idNodoOrigen);
  if (reubicada !== null) {
    resultado = resultado.conTransicion(reubicada);
    aGuardar.set(reubicada.idTransicion, reubicada);
  }
  resultado.validarAusenciaCiclos();
  return { arbol: resultado, aGuardar: [...aGuardar.values()] };
}
