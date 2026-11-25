import type { DatosVistaAgregada } from '../../results/vista-agregada';
import { conteo } from '../../value-objects/conteo-agregado.vo';
import { fechaAgregado } from '../../value-objects/fecha-agregado.vo';
import { esObjeto } from '../../value-objects/objeto-plano.vo';
import { tasaAgregada } from '../../value-objects/tasa-agregada.vo';

/** Efectividad agregada de las notificaciones de una cohorte (RF-134). */
export interface DatosNotificaciones extends DatosVistaAgregada {
  tasa_apertura_promedio: number | null;
  tasa_conversion_promedio: number | null;
  total_notificaciones_enviadas: number | null;
  total_notificaciones_entregadas: number | null;
  total_notificaciones_descartadas: number | null;
}

/** Proyecta el snapshot externo a la lista blanca de indicadores de notificaciones. */
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
