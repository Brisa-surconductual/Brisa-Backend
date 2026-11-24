import type {
  FuenteVistaAgregada,
  ResultadoFuenteAgregada,
} from './fuente-vista-agregada.port';

export abstract class NotificacionesAgregadasPort implements FuenteVistaAgregada {
  abstract obtener(idCohorte: string): Promise<ResultadoFuenteAgregada>;
}
