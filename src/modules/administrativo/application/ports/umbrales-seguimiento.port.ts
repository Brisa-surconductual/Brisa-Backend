import type { ValorConfiguracion } from '../../domain/results/valor-configuracion';
import type {
  ActorConfiguracion,
  CambioConfiguracionAplicado,
} from './rechazo-configuracion';

/**
 * Umbral vigente de M05 (RF-79). El catálogo de tipos lo define M05; hoy son
 * CRAVING_ELEVADO (RF-63), INACTIVIDAD (RF-68) y CLASIFICACION_PROGRESO (RF-70).
 */
export interface UmbralVigente {
  tipo_umbral: string;
  valor: ValorConfiguracion;
  unidad_medida: string;
  fecha_actualizacion: string;
}

/**
 * RF-136: interfaz de M-8 sobre el mecanismo de configuración de umbrales de
 * M05 (RF-79). M05 valida el rango y persiste; M-8 no guarda nada propio.
 */
export abstract class UmbralesSeguimientoPort {
  abstract listarUmbrales(): Promise<UmbralVigente[]>;

  /** null si el tipo no está definido en RF-79. */
  abstract obtenerUmbral(tipoUmbral: string): Promise<UmbralVigente | null>;

  /**
   * Valida y persiste el nuevo valor. Lanza `RechazoConfiguracionError` si M05
   * lo rechaza (400 / 404 / 409). `valorAnteriorEsperado` permite a M05 aplicar
   * el cambio solo si el vigente no cambió entretanto.
   */
  abstract actualizarUmbral(
    tipoUmbral: string,
    valorNuevo: unknown,
    valorAnteriorEsperado: unknown,
    actor: ActorConfiguracion,
  ): Promise<CambioConfiguracionAplicado<ValorConfiguracion>>;
}
