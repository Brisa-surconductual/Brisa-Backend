export const TIPOS_MENSAJE_NOTIFICACION = [
  'RECORDATORIO_USO',
  'PREVENCION_RECAIDA',
  'MOTIVACIONAL',
  'ACOMPANAMIENTO_EMOCIONAL',
] as const;
export const ESTADOS_MENSAJE_NOTIFICACION = [
  'BORRADOR',
  'ACTIVO',
  'INACTIVO',
] as const;

export type TipoMensajeNotificacion =
  (typeof TIPOS_MENSAJE_NOTIFICACION)[number];
export type EstadoMensajeNotificacion =
  (typeof ESTADOS_MENSAJE_NOTIFICACION)[number];

export type AccionMensajeNotificacion =
  | 'CREAR_MENSAJE'
  | 'EDITAR_MENSAJE'
  | 'ACTIVAR_MENSAJE'
  | 'INACTIVAR_MENSAJE'
  | 'ACTUALIZAR_TERMINOS_RESTRINGIDOS';

export interface ConsultaMensajesNotificacion {
  tipo_mensaje?: TipoMensajeNotificacion;
  estado?: EstadoMensajeNotificacion;
  offset: number;
  limit: number;
}

export interface CrearMensajeNotificacion {
  tipo_mensaje: TipoMensajeNotificacion;
  contenido_mensaje: string;
  justificacion_cambio?: string;
}

export type EditarMensajeNotificacion = Partial<CrearMensajeNotificacion>;

export interface ResultadoMensajeNotificacion {
  id_mensaje: string;
  estado: EstadoMensajeNotificacion;
}

export interface PaginaMensajesNotificacion {
  items: Array<
    ResultadoMensajeNotificacion & {
      tipo_mensaje: TipoMensajeNotificacion;
      contenido_mensaje: string;
      fecha_actualizacion: string;
    }
  >;
  total: number;
  offset: number;
  limit: number;
}

export interface ActualizarTerminosRestringidos {
  terminos: string[];
  justificacion_cambio?: string;
}

export interface TerminosRestringidos {
  terminos: string[];
  fecha_actualizacion: string;
  aplica_retroactivamente: false;
}
