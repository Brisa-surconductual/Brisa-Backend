import type { Cohorte } from '../entities/cohorte/cohorte.entity';

/** Cohorte enriquecida para consulta con el nombre de su cronograma (RF-124). */
export interface CohorteConsultada extends Cohorte {
  nombre_cronograma: string;
}
