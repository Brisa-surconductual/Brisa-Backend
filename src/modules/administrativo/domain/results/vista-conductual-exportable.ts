import type { DatosConductuales } from '../entities/vistas-agregadas/vista-conductual.entity';
import type { VistaAgregada } from './vista-agregada';

/** Vista conductual con datos garantizados: requisito para exportar (RF-144). */
export type VistaConductualExportable = VistaAgregada<DatosConductuales> & {
  datos: DatosConductuales;
};
