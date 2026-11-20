/** Interacción ya registrada (RF-30), tal como se guardó. Inmutable. */
export interface InteraccionRegistrada {
  idInteraccion: string;
  secuencia: number;
  timestampInteraccion: Date;
  registradaEn: Date;
  idNodo: string;
  tipoEntrada: string;
  valor: unknown;
}

export interface PaginaHistorialInteracciones {
  ultimaSecuencia: number;
  hayMas: boolean;
  /** Orden ascendente de secuencia. */
  interacciones: InteraccionRegistrada[];
}

export interface ConsultaHistorialInteracciones {
  idSesion: string;
  antesDe: number | null;
  limite: number;
}

/**
 * RF-31 / RF-32: lectura del historial de una sesión. Solo lectura; la
 * pertenencia de la sesión al usuario la comprueba el caso de uso.
 */
export abstract class HistorialInteraccionesRepository {
  abstract consultar(
    consulta: ConsultaHistorialInteracciones,
  ): Promise<PaginaHistorialInteracciones>;
}
