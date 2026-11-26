import type { FaseNarrativa } from '../../../domain/enums/fase-narrativa.enum';
import type { MODO_SOLO_LECTURA } from './seguimiento-individual.dto-response';

/** Respuesta 200 de `GET /admin/participantes/:codigo/progresion-narrativa` (RF-130). */
export interface ProgresionNarrativaDtoResponse {
  codigo_participante: string;
  id_fase_activa: string;
  nombre_fase_activa: FaseNarrativa;
  id_capitulo_completado: string | null;
  logros_narrativos_desbloqueados: {
    id_logro: string;
    nombre_logro: string;
    fecha_desbloqueo: string;
  }[];
  modo_consulta: typeof MODO_SOLO_LECTURA;
}
