export interface ReglaEntradaNodoActual {
  obligatorio: boolean;
  valorMin: number | null;
  valorMax: number | null;
  valoresPermitidos: string[];
}

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
  abstract consultarReglas(
    idNodo: string,
    idFlujo: string,
  ): Promise<ReglaEntradaNodoActual[]>;
  abstract consultarRecursos(idContenido: string): Promise<RecursoNodoActual[]>;
}

export abstract class FirmarRecursoNodoPort {
  abstract lectura(
    claveAlmacenamiento: string,
  ): Promise<{ url: string; expiraEn: string }>;
}
