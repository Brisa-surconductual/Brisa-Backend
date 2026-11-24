import {
  conteo,
  esObjeto,
  fechaAgregado,
  tasaAgregada,
} from './vista-agregada';
import type { DatosVistaAgregada } from './vista-agregada';

export interface DatosNotificaciones extends DatosVistaAgregada {
  tasa_apertura_promedio: number | null;
  tasa_conversion_promedio: number | null;
  total_notificaciones_enviadas: number | null;
  total_notificaciones_entregadas: number | null;
  total_notificaciones_descartadas: number | null;
}

export function proyectarDatosNotificaciones(
  valor: unknown,
): DatosNotificaciones | null {
  if (!esObjeto(valor)) return null;
  const fecha = fechaAgregado(valor.fecha_actualizacion);
  if (!fecha) return null;

  return {
    tasa_apertura_promedio: tasaAgregada(valor.tasa_apertura_promedio),
    tasa_conversion_promedio: tasaAgregada(valor.tasa_conversion_promedio),
    total_notificaciones_enviadas: conteo(valor.total_notificaciones_enviadas),
    total_notificaciones_entregadas: conteo(
      valor.total_notificaciones_entregadas,
    ),
    total_notificaciones_descartadas: conteo(
      valor.total_notificaciones_descartadas,
    ),
    fecha_actualizacion: fecha,
  };
}
