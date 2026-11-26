export interface BloqueNodoDtoResponse {
  orden: number;
  tipo: string;
  texto?: string;
  idRecurso?: string;
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

export interface DisponibilidadNodoDtoResponse {
  habilitado: boolean;
  /** Fecha real aproximada en que se habilita (ISO); null si ya lo está. */
  habilitaAprox: string | null;
}

export class PresentacionNodoActualDtoResponse {
  idSesion!: string;
  estadoSesion!: string;
  nodo!: {
    idNodo: string;
    tipoNodo: string;
    orden: number | null;
    esTerminal: boolean;
    /** RF-24/RF-22: si el estudiante ya puede responder este nodo. */
    disponibilidad: DisponibilidadNodoDtoResponse;
    bloques: BloqueNodoDtoResponse[];
    entrada: EntradaNodoDtoResponse | null;
  };
}
