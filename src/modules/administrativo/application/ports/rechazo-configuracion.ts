/**
 * Rechazo de validación de una configuración por parte del módulo dueño (M05
 * para RF-79, M07 para RF-87 / RF-88 / RF-89). Forma parte del contrato de
 * `UmbralesSeguimientoPort` y `ParametrosNotificacionPort`: M-8 lo reenvía al
 * cliente con el mismo status, código y mensaje, sin reinterpretarlo.
 *
 * Cualquier otro error del puerto se trata como fallo de persistencia (500).
 */
export class RechazoConfiguracionError extends Error {
  constructor(
    readonly status: 400 | 404 | 409,
    readonly codigo: string,
    readonly mensaje: string,
  ) {
    super(mensaje);
    this.name = 'RechazoConfiguracionError';
  }
}

/** Usuario administrativo que aplica el cambio (RF-79, RF-87, RF-88, RF-89). */
export interface ActorConfiguracion {
  id_usuario_administrativo: string;
}

/** Resultado de un cambio aplicado por el módulo dueño. */
export interface CambioConfiguracionAplicado<T> {
  valor_anterior: T;
  valor_vigente: T;
  fecha_actualizacion: string;
}
