import {
  BloqueNodoDtoResponse,
  EntradaNodoDtoResponse,
} from './presentacion-nodo-actual.dto-response';

/** `nodo` reutiliza la forma del RF-26 a propósito (ver contrato RF-31/32). */
export interface InteraccionHistorialDtoResponse {
  id_interaccion: string;
  secuencia: number;
  timestamp_interaccion: string;
  registrada_en: string;
  nodo: {
    idNodo: string;
    bloques: BloqueNodoDtoResponse[];
    entrada: EntradaNodoDtoResponse | null;
  };
  respuesta: { tipo_entrada: string; valor: unknown };
}

export class HistorialInteraccionesDtoResponse {
  data!: {
    id_sesion: string;
    ultima_secuencia: number;
    hay_mas: boolean;
    interacciones: InteraccionHistorialDtoResponse[];
  };
}
