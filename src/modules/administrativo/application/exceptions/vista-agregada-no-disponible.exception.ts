import { ServiceUnavailableException } from '@nestjs/common';
import type {
  DatosVistaAgregada,
  VistaAgregada,
} from '../../domain/results/vista-agregada';

/** La fuente no respondió; el cuerpo es la vista degradada (RF-132 a RF-134). */
export class VistaAgregadaNoDisponibleException extends ServiceUnavailableException {
  constructor(vista: VistaAgregada<DatosVistaAgregada>) {
    super(vista);
  }
}
