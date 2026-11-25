import type { FaseNarrativa } from '../enums/fase-narrativa.enum';
export const CONDICIONES_LOGRO_NARRATIVO = [
  'CAPITULO_COMPLETADO',
  'FASE_ALCANZADA',
  'PROGRAMA_FINALIZADO',
] as const;

export type CondicionLogroNarrativo =
  (typeof CONDICIONES_LOGRO_NARRATIVO)[number];
export type EstadoCapituloNarrativo = 'BORRADOR' | 'PUBLICADO' | 'INACTIVO';
export type EstadoLogroNarrativo = 'BORRADOR' | 'ACTIVO' | 'INACTIVO';

export type AccionContenidoNarrativo =
  | 'CREAR_CAPITULO'
  | 'EDITAR_CAPITULO'
  | 'PUBLICAR_CAPITULO'
  | 'INACTIVAR_CAPITULO'
  | 'CREAR_LOGRO'
  | 'EDITAR_LOGRO'
  | 'ACTIVAR_LOGRO'
  | 'INACTIVAR_LOGRO'
  | 'CONFIGURAR_REGLA_NIVEL';

export interface CrearCapituloNarrativo {
  fase: FaseNarrativa;
  titulo_capitulo: string;
  texto_historia?: string;
  mensaje_terapeutico_ligero?: string;
  instruccion_narrativa_mascota?: string;
  id_unidad_temporal?: string | null;
  orden?: number;
  justificacion_cambio?: string;
}

export type EditarCapituloNarrativo = Partial<CrearCapituloNarrativo>;

export interface ResultadoCapituloNarrativo {
  id_capitulo: string;
  estado: EstadoCapituloNarrativo;
}

export interface CapituloNarrativo extends ResultadoCapituloNarrativo {
  fase: FaseNarrativa;
  orden: number;
  titulo_capitulo: string;
  id_unidad_temporal: string | null;
  en_uso: boolean;
}

export interface CrearLogroNarrativo {
  nombre_logro: string;
  descripcion_logro: string;
  recurso_visual_logro: string;
  condicion_desbloqueo: CondicionLogroNarrativo;
  id_referencia?: string | null;
  justificacion_cambio?: string;
}

export type EditarLogroNarrativo = Partial<CrearLogroNarrativo>;

export interface ResultadoLogroNarrativo {
  id_logro_narrativo: string;
  estado: EstadoLogroNarrativo;
}

export type LogroNarrativo = ResultadoLogroNarrativo &
  Omit<CrearLogroNarrativo, 'justificacion_cambio'>;

export interface GuardarReglaNivel {
  capitulos_requeridos: number;
  logros_requeridos: number;
  justificacion_cambio?: string;
}

export interface ReglaNivelNarrativo {
  nivel_gamificacion: number;
  capitulos_requeridos: number;
  logros_requeridos: number;
  estado: 'ACTIVA' | 'INACTIVA';
}

export interface CoberturaNarrativa {
  total_capitulos_definidos: number;
  total_capitulos_publicados: number;
  capitulos_pendientes: Array<
    Pick<CapituloNarrativo, 'id_capitulo' | 'orden' | 'estado'>
  >;
}
