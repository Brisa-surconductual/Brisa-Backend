import { Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, Matches, Max, Min } from 'class-validator';
import {
  ESTADOS_MENSAJE_NOTIFICACION,
  TIPOS_MENSAJE_NOTIFICACION,
  type ActualizarTerminosRestringidos,
  type ConsultaMensajesNotificacion,
  type CrearMensajeNotificacion,
  type EditarMensajeNotificacion,
  type EstadoMensajeNotificacion,
  type TipoMensajeNotificacion,
} from '../../domain/results/mensajes-notificacion';
import { SiFueEnviado, TextoNoVacio } from '../http/validar-gestion-contenido';

export class ConsultaMensajesNotificacionDto implements ConsultaMensajesNotificacion {
  @SiFueEnviado()
  @IsIn(TIPOS_MENSAJE_NOTIFICACION)
  tipo_mensaje?: TipoMensajeNotificacion;

  @SiFueEnviado()
  @IsIn(ESTADOS_MENSAJE_NOTIFICACION)
  estado?: EstadoMensajeNotificacion;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(Number.MAX_SAFE_INTEGER)
  offset = 0;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

export class CrearMensajeNotificacionDto implements CrearMensajeNotificacion {
  @IsIn(TIPOS_MENSAJE_NOTIFICACION)
  tipo_mensaje!: TipoMensajeNotificacion;

  @TextoNoVacio()
  contenido_mensaje!: string;

  @TextoNoVacio(true)
  justificacion_cambio?: string;
}

export class EditarMensajeNotificacionDto implements EditarMensajeNotificacion {
  @SiFueEnviado()
  @IsIn(TIPOS_MENSAJE_NOTIFICACION)
  tipo_mensaje?: TipoMensajeNotificacion;

  @TextoNoVacio(true)
  contenido_mensaje?: string;

  @TextoNoVacio(true)
  justificacion_cambio?: string;
}

export class ActualizarTerminosRestringidosDto implements ActualizarTerminosRestringidos {
  @IsArray()
  @Matches(/\S/u, { each: true })
  terminos!: string[];

  @TextoNoVacio(true)
  justificacion_cambio?: string;
}
