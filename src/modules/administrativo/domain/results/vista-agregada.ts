import type { EstadoAgregacion } from '../enums/estado-agregacion.enum';
import type { EstadoVistaAgregada } from '../enums/estado-vista-agregada.enum';
import type { MotivoSinDatos } from '../enums/motivo-sin-datos.enum';

/** Lo mínimo que todo agregado consolidado debe exponer. */
export interface DatosVistaAgregada {
  fecha_actualizacion: string;
}

/** Envoltura común de las vistas agregadas por cohorte (RF-132 a RF-134). */
export interface VistaAgregada<T extends DatosVistaAgregada> {
  id_cohorte: string;
  estado: EstadoVistaAgregada;
  estado_agregacion: EstadoAgregacion;
  ultimo_timestamp_disponible: string | null;
  motivo_sin_datos: MotivoSinDatos | null;
  mensaje: string | null;
  datos: T | null;
}
