import type { EstadoResolucionAlerta } from '../../domain/enums/estado-resolucion-alerta.enum';
import type { TendenciaConsumo } from '../../domain/enums/tendencia-consumo.enum';
import type {
  FuenteAlerta,
  IndicadoresAdherencia,
  IndicadoresProgreso,
  TipoAlerta,
} from '../../domain/results/seguimiento-individual';

/** Alerta activa tal como la expone M05 en el perfil (RF-77). */
export interface AlertaActivaM05 {
  id_alerta: string;
  tipo_alerta: TipoAlerta;
  fecha_generacion: string;
  estado_resolucion?: EstadoResolucionAlerta | null;
}

/** Perfil de seguimiento individual expuesto por M05 (RF-77). */
export interface PerfilSeguimientoDto {
  codigo_participante: string;
  indicadores_adherencia: IndicadoresAdherencia;
  indicadores_progreso: IndicadoresProgreso;
  tendencia_consumo: TendenciaConsumo;
  alertas_activas: AlertaActivaM05[];
  fecha_actualizacion: string;
}

/** Alerta del historial expuesta por M05 (RF-63, RF-68). */
export interface AlertaM05 {
  id_alerta: string;
  tipo_alerta: TipoAlerta;
  fuente_alerta: FuenteAlerta;
  fecha_generacion: string;
  estado_resolucion?: EstadoResolucionAlerta | null;
  fecha_resolucion?: string | null;
}

/** Una alerta concreta junto al participante al que M05 la atribuye. */
export interface AlertaParticipanteM05 {
  codigo_participante: string;
  alerta: AlertaM05;
}

/** Página del historial de alertas de un participante expuesta por M05. */
export interface ListaAlertasDto {
  codigo_participante: string;
  items: AlertaM05[];
  total: number;
}

/**
 * Puerto hacia M05 para el seguimiento individual (RF-128, RF-129). Mientras
 * M05 no publique RF-77, lo implementa `MockSeguimientoIndividualAdapter`.
 * Devuelve null si M05 no tiene datos del participante; lanza si no responde.
 */
export abstract class SeguimientoIndividualPort {
  abstract obtenerPerfilSeguimiento(
    codigoParticipante: string,
  ): Promise<PerfilSeguimientoDto | null>;

  abstract obtenerAlertasParticipante(
    codigoParticipante: string,
    offset: number,
    limit: number,
  ): Promise<ListaAlertasDto | null>;

  /** Una alerta del participante, o null si M05 no la tiene (RF-147). */
  abstract obtenerAlerta(
    codigoParticipante: string,
    idAlerta: string,
  ): Promise<AlertaParticipanteM05 | null>;
}
