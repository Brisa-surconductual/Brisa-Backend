/** Identifica un nodo señalado por el diagnóstico, sin formato de presentación. */
export interface NodoDiagnostico {
  readonly id_nodo: string;
  readonly orden: number | null;
  readonly texto: string;
}

export interface DiagnosticoArbol {
  readonly nodos_huerfanos: NodoDiagnostico[];
  readonly ciclos: NodoDiagnostico[][];
  readonly sin_nodo_inicial: boolean;
  /** RF-25: el flujo debe tener exactamente un nodo final. */
  readonly sin_nodo_final: boolean;
  /** RF-25: nodos no finales sin transición explícita ni avance implícito. */
  readonly nodos_sin_salida: NodoDiagnostico[];
}
