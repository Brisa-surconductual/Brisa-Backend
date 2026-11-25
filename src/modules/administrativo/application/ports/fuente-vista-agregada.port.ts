import { EstadoFuenteAgregada } from '../../domain/enums/estado-fuente-agregada.enum';

export type ResultadoFuenteAgregada = { id_cohorte: string } & (
  | { estado: typeof EstadoFuenteAgregada.ACTUALIZADO; datos: unknown }
  | {
      estado: Exclude<
        EstadoFuenteAgregada,
        typeof EstadoFuenteAgregada.ACTUALIZADO
      >;
    }
);

export interface FuenteVistaAgregada {
  obtener(idCohorte: string): Promise<ResultadoFuenteAgregada>;
}

export function fuenteAgregadaNoDisponible(
  id_cohorte: string,
): ResultadoFuenteAgregada {
  return { id_cohorte, estado: EstadoFuenteAgregada.NO_DISPONIBLE };
}
