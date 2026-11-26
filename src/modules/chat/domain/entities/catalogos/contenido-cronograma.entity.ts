/**
 * Contenido ya asociado a una unidad temporal de un cronograma
 * (`cronograma.contenidos_cronograma`), disponible para vincularse a un
 * nodo conversacional (RF-25). No representa `cronograma.contenidos`
 * directamente: un contenido sin asociación a una unidad temporal nunca
 * aparece aquí.
 */
export class ContenidoCronogramaConversacional {
  constructor(
    readonly idContenidoCronograma: string,
    readonly idContenido: string,
    readonly nombreContenido: string,
    readonly idUnidadTemporal: string,
    readonly nombreUnidad: string,
    readonly ordenUnidad: number,
  ) {}
}
