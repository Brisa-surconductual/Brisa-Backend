/**
 * RF-43: el flujo SOS es un sub-árbol de nodos fijos, independiente del
 * flujo psicoeducativo: no captura perfil clínico ni depende del cronograma.
 */
export interface DiagnosticoRestriccionesSos {
  /** Nodos con marca `capturaPerfil` (o su alias legado). */
  readonly nodos_con_captura_perfil: string[];
  /** Nodos ligados a un contenido del cronograma (RF-24). */
  readonly nodos_con_contenido_cronograma: string[];
}
