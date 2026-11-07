export interface BloqueNodoDtoResponse {
  orden: number;
  tipo: string;
  texto?: string;
  url?: string;
  expiraEn?: string | null;
  mimeType?: string | null;
  textoAlternativo?: string | null;
  duracionSegundos?: number | null;
}

export interface EntradaNodoDtoResponse {
  tipo: string;
  obligatorio: boolean;
  min: number | string | null;
  max: number | string | null;
  paso: number | null;
  opciones: { valor: string; etiqueta: string }[] | null;
  etiquetas: { min: string; max: string } | null;
  maxCaracteres: number | null;
}

export class PresentacionNodoActualDtoResponse {
  idSesion!: string;
  estadoSesion!: string;
  nodo!: {
    idNodo: string;
    tipoNodo: string;
    orden: number | null;
    esTerminal: boolean;
    bloques: BloqueNodoDtoResponse[];
    entrada: EntradaNodoDtoResponse | null;
  };
}
