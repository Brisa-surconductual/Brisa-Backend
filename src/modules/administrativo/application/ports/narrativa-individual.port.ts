import type { FaseNarrativa } from '../../domain/enums/fase-narrativa.enum';

/** Estados de la progresión narrativa definidos en RF-116. */
export type EstadoProgresionNarrativa =
  'ACTIVA' | 'INICIAL' | 'COMPLETADA' | 'SIN_AVANCE';

/** Logro narrativo desbloqueado (RF-107), tal como lo expone M06. */
export interface LogroNarrativoM06 {
  id_logro: string;
  nombre_logro: string;
  fecha_desbloqueo: string;
}

/** Estado de progresión narrativa de un usuario expuesto por M06 (RF-116). */
export interface ProgresionNarrativaM06 {
  /** Usuario al que pertenece el perfil; M-8 exige que sea el solicitado. */
  id_usuario: string;
  id_perfil_narrativo: string;
  id_fase_activa: string;
  nombre_fase_activa: FaseNarrativa;
  /** null mientras no haya completado ningún capítulo (estado INICIAL). */
  id_capitulo_completado: string | null;
  nivel_gamificacion_actual: number;
  logros_narrativos_desbloqueados: LogroNarrativoM06[];
  fecha_actualizacion_progresion: string;
  estado_progresion_narrativa: EstadoProgresionNarrativa;
}

/**
 * RF-130: lectura del estado narrativo individual que M06 expone (RF-116).
 * Filtra estrictamente por `id_usuario`.
 */
export abstract class NarrativaIndividualPort {
  /** null si el usuario no tiene perfil narrativo (204). */
  abstract obtenerProgresionNarrativa(
    idUsuario: string,
  ): Promise<ProgresionNarrativaM06 | null>;
}
