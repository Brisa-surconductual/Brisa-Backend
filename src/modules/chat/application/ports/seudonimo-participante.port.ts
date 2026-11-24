/**
 * A7: identificador seudónimo de un participante (p. ej. `P-1A2B3C4D`), el
 * mismo que usa M-8.
 */
export abstract class SeudonimoParticipantePort {
  /** Seudónimo del participante; si aún no tiene uno, se crea. */
  abstract obtener(idUsuario: string): Promise<string>;

  /**
   * Participante dueño de un seudónimo ya asignado, o null si no existe.
   * Solo lectura: nunca crea seudónimos (RF-38, listado de M-8).
   */
  abstract resolver(codigoParticipante: string): Promise<string | null>;
}
