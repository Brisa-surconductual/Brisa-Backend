import type {
  FuenteVistaAgregada,
  ResultadoFuenteAgregada,
} from './fuente-vista-agregada.port';

export type ResultadoSeguimientoAgregado = ResultadoFuenteAgregada;

export abstract class SeguimientoAgregadoPort implements FuenteVistaAgregada {
  abstract obtener(idCohorte: string): Promise<ResultadoSeguimientoAgregado>;
}
