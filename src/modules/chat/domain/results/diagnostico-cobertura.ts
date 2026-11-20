import { NodoDiagnostico } from './diagnostico-arbol';

/** Nodo de selección única o Sí/No con opciones sin transición (RF-25). */
export interface NodoSinCobertura extends NodoDiagnostico {
  readonly valores_faltantes: string[];
}

export interface DiagnosticoCobertura {
  readonly nodos_sin_cobertura: NodoSinCobertura[];
}
