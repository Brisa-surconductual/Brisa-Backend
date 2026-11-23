/**
 * A7: identificador seudónimo de un participante (p. ej. `P-1A2B3C4D`), el
 * mismo que usa M-8. Si el participante aún no tiene uno, se crea.
 */
export abstract class SeudonimoParticipantePort {
  abstract obtener(idUsuario: string): Promise<string>;
}
