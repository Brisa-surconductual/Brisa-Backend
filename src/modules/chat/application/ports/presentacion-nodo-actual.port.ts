export interface RecursoNodoActual {
  idRecurso: string;
  tipo: string;
  orden: number;
  texto: string | null;
  claveAlmacenamiento: string | null;
  mimeType: string | null;
  textoAlternativo: string | null;
  duracionSegundos: number | null;
}

export abstract class PresentacionNodoActualPort {
  /** RF-25: terminal = nodo final del flujo (legado: sin transiciones de salida). */
  abstract esTerminal(idNodo: string, idFlujo: string): Promise<boolean>;
  abstract consultarRecursos(idContenido: string): Promise<RecursoNodoActual[]>;
}

export abstract class FirmarRecursoNodoPort {
  abstract lectura(
    claveAlmacenamiento: string,
  ): Promise<{ url: string; expiraEn: string }>;
}
