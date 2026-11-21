import { BloqueNodoDtoResponse } from './presentacion-nodo-actual.dto-response';

export interface InteraccionHistorialDtoResponse {
  id_interaccion: string;
  secuencia: number;
  timestamp_interaccion: string;
  nodo: {
    id_nodo: string;
    tipo_nodo: string;
    bloques: BloqueNodoDtoResponse[];
  };
  respuesta: { tipo_entrada: string; valor: unknown; etiqueta: string | null };
  id_nodo_destino: string;
}

export class HistorialInteraccionesDtoResponse {
  data!: {
    items: InteraccionHistorialDtoResponse[];
    hay_mas: boolean;
    siguiente_cursor: number | null;
  };
}
