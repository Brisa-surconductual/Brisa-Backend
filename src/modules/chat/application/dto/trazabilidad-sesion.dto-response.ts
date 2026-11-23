import { RegistroTrazabilidad } from '../../domain/repositories/historial-interacciones.repository';

export class RegistroTrazabilidadDtoResponse {
  secuencia!: number;
  id_nodo!: string;
  /** Valor guardado sin modificar (RF-27); CONTINUAR lleva `valor: null`. */
  respuesta_usuario!: { valor: unknown };
  /** null cuando el registro es el fin del flujo. */
  id_nodo_destino!: string | null;
  timestamp_interaccion!: string;
}

/** Trazabilidad de una sesión conversacional (solo lectura). */
export class TrazabilidadSesionDtoResponse {
  id_sesion!: string;
  /** Seudónimo del participante (A7). */
  id_participante!: string;
  registros!: RegistroTrazabilidadDtoResponse[];

  static crear(
    idSesion: string,
    idParticipante: string,
    registros: RegistroTrazabilidad[],
  ): TrazabilidadSesionDtoResponse {
    return {
      id_sesion: idSesion,
      id_participante: idParticipante,
      registros: registros.map((registro) => ({
        secuencia: registro.secuencia,
        id_nodo: registro.idNodo,
        respuesta_usuario: { valor: registro.valor },
        id_nodo_destino: registro.idNodoDestino,
        timestamp_interaccion: registro.timestampInteraccion.toISOString(),
      })),
    };
  }
}
