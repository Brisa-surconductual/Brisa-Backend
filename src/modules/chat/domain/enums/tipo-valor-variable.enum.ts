import { TipoEntradaRespuesta } from './tipo-entrada-respuesta.enum';

/** RF-30B: forma del valor que mide una variable de la taxonomía. */
export enum TipoValorVariable {
  ENTERO = 'ENTERO',
  CATEGORIA = 'CATEGORIA',
  BOOLEANO = 'BOOLEANO',
}

/** RF-30B: tipos de entrada del nodo que puede admitir cada tipo de valor. */
export const ENTRADAS_POR_TIPO_VALOR: Record<
  TipoValorVariable,
  readonly TipoEntradaRespuesta[]
> = {
  [TipoValorVariable.ENTERO]: [
    TipoEntradaRespuesta.ESCALA,
    TipoEntradaRespuesta.NUMERICO,
  ],
  [TipoValorVariable.CATEGORIA]: [
    TipoEntradaRespuesta.OPCION_UNICA,
    TipoEntradaRespuesta.MULTISELECCION,
  ],
  [TipoValorVariable.BOOLEANO]: [TipoEntradaRespuesta.BOOLEANO],
};

/** RF-30B: el etiquetado está completo cuando el perfil clínico tiene ambas dimensiones. */
export enum EstadoEtiquetado {
  COMPLETO = 'COMPLETO',
  PENDIENTE_PERFIL = 'PENDIENTE_PERFIL',
}
