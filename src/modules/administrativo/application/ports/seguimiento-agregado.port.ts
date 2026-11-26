import type { CampoFiltroAgregado } from '../../domain/results/filtros-agregados';
import type {
  ConsultaFuenteAgregada,
  FuenteVistaAgregada,
  ResultadoFuenteAgregada,
} from './fuente-vista-agregada.port';

export type ResultadoSeguimientoAgregado = ResultadoFuenteAgregada;

export abstract class SeguimientoAgregadoPort implements FuenteVistaAgregada {
  declare readonly filtrosSoportados?: readonly CampoFiltroAgregado[];
  abstract obtener(
    idCohorte: string,
    consulta?: ConsultaFuenteAgregada,
  ): Promise<ResultadoSeguimientoAgregado>;
}
