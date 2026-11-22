import { Prisma } from '@prisma/client';
import { NodoConversacional } from '../../domain/entities/flujo/nodo-conversacional.entity';

/**
 * RF-25 / RF-24: acceso con SQL parametrizado a las columnas de `chat.nodos`
 * que el cliente tipado aún no conoce (`es_nodo_final`, `id_contenido`).
 *
 * `schema.prisma` lo regenera el workflow `prisma-generate-schema` después del
 * merge. Cuando se regenere, estas consultas pueden pasar al cliente tipado.
 */
type Cliente = Pick<Prisma.TransactionClient, '$queryRaw' | '$executeRaw'>;

export interface ExtrasNodo {
  readonly esNodoFinal: boolean;
  readonly idContenido: string | null;
}

export const SIN_EXTRAS: ExtrasNodo = Object.freeze({
  esNodoFinal: false,
  idContenido: null,
});

export async function extrasNodos(
  cliente: Cliente,
  idsNodos: string[],
): Promise<Map<string, ExtrasNodo>> {
  if (idsNodos.length === 0) return new Map();
  const filas = await cliente.$queryRaw<
    { id_nodo: string; es_nodo_final: boolean; id_contenido: string | null }[]
  >`
    SELECT id_nodo::text AS id_nodo, es_nodo_final, id_contenido::text AS id_contenido
    FROM chat.nodos
    WHERE id_nodo = ANY(${idsNodos}::uuid[])`;
  return new Map(
    filas.map((fila) => [
      fila.id_nodo,
      {
        esNodoFinal: fila.es_nodo_final === true,
        idContenido: fila.id_contenido,
      },
    ]),
  );
}

export async function guardarExtrasNodo(
  cliente: Cliente,
  nodo: Pick<NodoConversacional, 'idNodo' | 'esNodoFinal' | 'idContenido'>,
): Promise<void> {
  await cliente.$executeRaw`
    UPDATE chat.nodos
    SET es_nodo_final = ${nodo.esNodoFinal},
        id_contenido = ${nodo.idContenido}::uuid
    WHERE id_nodo = ${nodo.idNodo}::uuid`;
}

/**
 * RF-25 / RF-26 / RF-29: un nodo es terminal si es el nodo final del flujo.
 * En flujos legado (sin nodo final marcado) es terminal si no tiene salidas.
 */
export async function esNodoTerminal(
  cliente: Cliente,
  idNodo: string,
  idFlujo: string,
): Promise<boolean> {
  const [fila] = await cliente.$queryRaw<{ terminal: boolean }[]>`
    SELECT CASE
      WHEN EXISTS (
        SELECT 1 FROM chat.nodos f
        WHERE f.id_flujo = ${idFlujo}::uuid AND f.es_nodo_final = true
      ) THEN n.es_nodo_final
      ELSE NOT EXISTS (
        SELECT 1 FROM chat.reglas_nodos r
        WHERE r.id_nodo_origen = n.id_nodo AND r.id_flujo = ${idFlujo}::uuid
      )
    END AS terminal
    FROM chat.nodos n
    WHERE n.id_nodo = ${idNodo}::uuid`;
  return fila?.terminal === true;
}

/**
 * RF-25: siguiente nodo por `orden` para el avance implícito de un nodo sin
 * respuesta. Misma regla que `siguienteNodoPorOrden` del dominio: solo en
 * flujos con nodo final y nunca desde el propio nodo final.
 */
export async function idSiguienteNodoPorOrden(
  cliente: Cliente,
  idNodo: string,
): Promise<string | null> {
  const [fila] = await cliente.$queryRaw<{ id_nodo: string }[]>`
    SELECT s.id_nodo::text AS id_nodo
    FROM chat.nodos n
    JOIN chat.nodos s
      ON s.id_flujo = n.id_flujo AND s.orden IS NOT NULL AND s.orden > n.orden
    WHERE n.id_nodo = ${idNodo}::uuid
      AND n.es_nodo_final = false
      AND EXISTS (
        SELECT 1 FROM chat.nodos f
        WHERE f.id_flujo = n.id_flujo AND f.es_nodo_final = true
      )
    ORDER BY s.orden ASC
    LIMIT 1`;
  return fila?.id_nodo ?? null;
}
