import type { EstadoResolucionAlerta } from '../../../domain/enums/estado-resolucion-alerta.enum';
import type { TendenciaConsumo } from '../../../domain/enums/tendencia-consumo.enum';
import type {
  FuenteAlerta,
  IndicadoresAdherencia,
  IndicadoresProgreso,
  TipoAlerta,
} from '../../../domain/results/seguimiento-individual';

export const MODO_SOLO_LECTURA = 'SOLO_LECTURA' as const;

/** Respuesta 200 de `GET /admin/participantes/:codigo/perfil-seguimiento` (RF-128). */
export interface PerfilSeguimientoDtoResponse {
  codigo_participante: string;
  indicadores_adherencia: IndicadoresAdherencia;
  indicadores_progreso: IndicadoresProgreso;
  tendencia_consumo: TendenciaConsumo;
  alertas_activas: {
    id_alerta: string;
    tipo_alerta: TipoAlerta;
    fecha_generacion: string;
    estado_resolucion: EstadoResolucionAlerta;
  }[];
  fecha_actualizacion: string;
  modo_consulta: typeof MODO_SOLO_LECTURA;
}

/** Elemento del historial de alertas (RF-129). */
export interface AlertaHistorialDtoResponse {
  id_alerta: string;
  tipo_alerta: TipoAlerta;
  fuente_alerta: FuenteAlerta;
  fecha_generacion: string;
  estado_resolucion: EstadoResolucionAlerta;
  fecha_resolucion: string | null;
}

/** Respuesta 200 de `GET /admin/participantes/:codigo/alertas` (RF-129). */
export interface HistorialAlertasDtoResponse {
  items: AlertaHistorialDtoResponse[];
  total: number;
  offset: number;
  limit: number;
  modo_consulta: typeof MODO_SOLO_LECTURA;
}
