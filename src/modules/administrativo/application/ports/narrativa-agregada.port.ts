import type {
  FuenteVistaAgregada,
  ResultadoFuenteAgregada,
} from './fuente-vista-agregada.port';

export abstract class NarrativaAgregadaPort implements FuenteVistaAgregada {
  abstract obtener(idCohorte: string): Promise<ResultadoFuenteAgregada>;
}
