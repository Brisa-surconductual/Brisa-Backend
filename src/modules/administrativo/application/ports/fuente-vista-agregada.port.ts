import { EstadoFuenteAgregada } from '../../domain/enums/estado-fuente-agregada.enum';
import type {
  CampoFiltroAgregado,
  FiltrosAgregados,
} from '../../domain/results/filtros-agregados';

export type ResultadoFuenteAgregada = { id_cohorte: string } & (
  | { estado: typeof EstadoFuenteAgregada.ACTUALIZADO; datos: unknown }
  | {
      estado: Exclude<
        EstadoFuenteAgregada,
        typeof EstadoFuenteAgregada.ACTUALIZADO
      >;
    }
);

export interface ConsultaFuenteAgregada {
  filtros?: FiltrosAgregados;
  incluirHistoricas?: boolean;
}

export interface FuenteVistaAgregada {
  readonly filtrosSoportados?: readonly CampoFiltroAgregado[];
  obtener(
    idCohorte: string,
    consulta?: ConsultaFuenteAgregada,
  ): Promise<ResultadoFuenteAgregada>;
}

export function fuenteAgregadaNoDisponible(
  id_cohorte: string,
): ResultadoFuenteAgregada {
  return { id_cohorte, estado: EstadoFuenteAgregada.NO_DISPONIBLE };
}
