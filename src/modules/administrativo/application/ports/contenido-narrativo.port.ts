import type {
  CapituloNarrativo,
  CoberturaNarrativa,
  CrearCapituloNarrativo,
  CrearLogroNarrativo,
  EditarCapituloNarrativo,
  EditarLogroNarrativo,
  GuardarReglaNivel,
  LogroNarrativo,
  ReglaNivelNarrativo,
  ResultadoCapituloNarrativo,
  ResultadoLogroNarrativo,
} from '../../domain/results/contenido-narrativo';

export abstract class ContenidoNarrativoPort {
  abstract listarCapitulos(): Promise<{ items: CapituloNarrativo[] }>;
  abstract crearCapitulo(
    actor: string,
    entrada: CrearCapituloNarrativo,
  ): Promise<ResultadoCapituloNarrativo>;
  /** M-6 verifica completados y bloquea la escritura de forma atómica. */
  abstract editarCapitulo(
    actor: string,
    id: string,
    entrada: EditarCapituloNarrativo,
  ): Promise<ResultadoCapituloNarrativo>;
  abstract publicarCapitulo(
    actor: string,
    id: string,
  ): Promise<ResultadoCapituloNarrativo>;
  abstract inactivarCapitulo(
    actor: string,
    id: string,
  ): Promise<ResultadoCapituloNarrativo>;
  abstract listarLogros(): Promise<{ items: LogroNarrativo[] }>;
  abstract crearLogro(
    actor: string,
    entrada: CrearLogroNarrativo,
  ): Promise<ResultadoLogroNarrativo>;
  abstract editarLogro(
    actor: string,
    id: string,
    entrada: EditarLogroNarrativo,
  ): Promise<ResultadoLogroNarrativo>;
  abstract activarLogro(
    actor: string,
    id: string,
  ): Promise<ResultadoLogroNarrativo>;
  abstract inactivarLogro(
    actor: string,
    id: string,
  ): Promise<ResultadoLogroNarrativo>;
  abstract guardarReglaNivel(
    actor: string,
    nivel: number,
    entrada: GuardarReglaNivel,
  ): Promise<ReglaNivelNarrativo>;
  abstract consultarCobertura(): Promise<CoberturaNarrativa>;
}
