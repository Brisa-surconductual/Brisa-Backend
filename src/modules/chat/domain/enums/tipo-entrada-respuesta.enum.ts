export enum TipoEntradaRespuesta {
  OPCION_UNICA = 'OPCION_UNICA',
  MULTISELECCION = 'MULTISELECCION',
  ESCALA = 'ESCALA',
  NUMERICO = 'NUMERICO',
  FECHA_HORA = 'FECHA_HORA',
  BOOLEANO = 'BOOLEANO',
  TEXTO_LIBRE = 'TEXTO_LIBRE',
  CONTINUAR = 'CONTINUAR',
}

/** Los alias son solo de configuración histórica, no del request público. */
export function tipoEntradaConfigurado(
  tipo: unknown,
): TipoEntradaRespuesta | null {
  if (tipo === 'SELECCION_UNICA') return TipoEntradaRespuesta.OPCION_UNICA;
  if (tipo === 'SELECCION_MULTIPLE') return TipoEntradaRespuesta.MULTISELECCION;
  return Object.values(TipoEntradaRespuesta).includes(
    tipo as TipoEntradaRespuesta,
  )
    ? (tipo as TipoEntradaRespuesta)
    : null;
}
