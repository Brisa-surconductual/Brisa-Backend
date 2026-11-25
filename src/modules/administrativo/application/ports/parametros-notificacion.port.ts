import type { TipoParametroNotificacion } from '../../domain/enums/tipo-parametro-notificacion.enum';
import type { ValorConfiguracion } from '../../domain/results/valor-configuracion';
import type {
  ActorConfiguracion,
  CambioConfiguracionAplicado,
} from './rechazo-configuracion';

/** Segmentos del día de RF-89 (UTC-5). */
export type SegmentoFranja = 'MANANA' | 'TARDE' | 'NOCHE';

/**
 * Franja horaria de entrega (RF-89). Horas en formato HH:MM, UTC-5. Es un
 * `type` (no `interface`) para que encaje en `ValorConfiguracion`.
 */
export type FranjaHoraria = {
  segmento: SegmentoFranja;
  hora_inicio: string;
  hora_fin: string;
  habilitada_dias_habiles: boolean;
  habilitada_fines_semana: boolean;
};

/** Parámetros globales vigentes de M07, con la forma del contrato de RF-137. */
export type ParametrosNotificacion = {
  /** RF-87. */
  LIMITE_DIARIO: { dias_habiles: number; fines_semana: number };
  /** RF-88. */
  INTERVALO_MINIMO: { horas: number };
  /** RF-89. */
  FRANJAS_HORARIAS: FranjaHoraria[];
};

/**
 * RF-137: interfaz de M-8 sobre los tres mecanismos de configuración de M07
 * (RF-87, RF-88 y RF-89). M07 valida y persiste; M-8 no guarda nada propio.
 * La configuración es global: no existe ningún valor por usuario.
 */
export abstract class ParametrosNotificacionPort {
  abstract obtenerParametros(): Promise<ParametrosNotificacion>;

  /**
   * Valida y persiste el nuevo valor del parámetro. Lanza
   * `RechazoConfiguracionError` si M07 lo rechaza (400 / 409, con los códigos y
   * mensajes de RF-87, RF-88 o RF-89). `valorAnteriorEsperado` permite a M07
   * aplicar el cambio solo si el vigente no cambió entretanto.
   */
  abstract actualizarParametro(
    tipo: TipoParametroNotificacion,
    valorNuevo: unknown,
    valorAnteriorEsperado: unknown,
    actor: ActorConfiguracion,
  ): Promise<CambioConfiguracionAplicado<ValorConfiguracion>>;
}
