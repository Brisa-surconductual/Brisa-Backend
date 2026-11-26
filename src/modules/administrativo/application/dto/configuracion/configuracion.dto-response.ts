import type { TipoParametroNotificacion } from '../../../domain/enums/tipo-parametro-notificacion.enum';
import type { ValorConfiguracion } from '../../../domain/results/valor-configuracion';
import type { UmbralVigente } from '../../ports/umbrales-seguimiento.port';

export type { ParametrosNotificacion as ParametrosNotificacionDtoResponse } from '../../ports/parametros-notificacion.port';

/** Respuesta 200 de `GET /admin/configuracion/umbrales` (RF-136). */
export interface UmbralesDtoResponse {
  items: UmbralVigente[];
}

/** Respuesta 200 de `PUT /admin/configuracion/umbrales/:tipo_umbral` (RF-136). */
export interface CambioUmbralDtoResponse {
  tipo_umbral: string;
  valor_anterior: ValorConfiguracion;
  valor_vigente: ValorConfiguracion;
  unidad_medida: string;
  cambio_aplicado: boolean;
}

/** Respuesta 200 de `PUT /admin/configuracion/notificaciones/:tipo_parametro` (RF-137). */
export interface CambioParametroNotificacionDtoResponse {
  tipo_parametro: TipoParametroNotificacion;
  valor_anterior: ValorConfiguracion;
  valor_vigente: ValorConfiguracion;
  cambio_aplicado: boolean;
}
