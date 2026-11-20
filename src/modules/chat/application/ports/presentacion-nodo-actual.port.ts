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
  /** Si el nodo tiene al menos una transición saliente (si no, es terminal). */
  abstract tieneSalidas(idNodo: string, idFlujo: string): Promise<boolean>;
  abstract consultarRecursos(idContenido: string): Promise<RecursoNodoActual[]>;
}

export abstract class FirmarRecursoNodoPort {
  abstract lectura(
    claveAlmacenamiento: string,
  ): Promise<{ url: string; expiraEn: string }>;
}
